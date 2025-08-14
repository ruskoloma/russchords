#!/usr/bin/env bash
set -euo pipefail

: "${CLUSTER_RECORD_NAME:?Need CLUSTER_RECORD_NAME}"
: "${ZONE_NAME:?Need ZONE_NAME}"
: "${EIP_TAG:?Need EIP_TAG}"
: "${TTL:=60}"

IMDS="http://169.254.169.254"
TOKEN=$(curl -s -X PUT "$IMDS/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
md() { curl -s -H "X-aws-ec2-metadata-token: $TOKEN" "$IMDS/latest/$1"; }

INSTANCE_ID=$(md meta-data/instance-id)
REGION=$(md dynamic/instance-identity/document | awk -F\" '/region/{print $4}')
echo "[bootstrap] InstanceId=${INSTANCE_ID}, Region=${REGION}"

EIP_ALLOC_ID=$(aws ec2 describe-addresses --region "$REGION" \
  --filters "Name=tag:Name,Values=${EIP_TAG}" \
  --query "Addresses[0].AllocationId" --output text)
if [[ -z "$EIP_ALLOC_ID" || "$EIP_ALLOC_ID" == "None" ]]; then
  echo "[bootstrap] ERROR: EIP with tag Name=${EIP_TAG} not found"
  exit 1
fi

NETWORK_INTERFACE_ID=$(aws ec2 describe-instances --region "$REGION" --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].NetworkInterfaces[?Attachment.DeviceIndex==\`0\`].NetworkInterfaceId" \
  --output text)
if [[ -z "$NETWORK_INTERFACE_ID" || "$NETWORK_INTERFACE_ID" == "None" ]]; then
  echo "[bootstrap] ERROR: Primary ENI not found"
  exit 1
fi

read -r ASSOC_ID ASSOC_INST_ID PUBLIC_IP <<<"$(aws ec2 describe-addresses \
  --region "$REGION" \
  --allocation-ids "$EIP_ALLOC_ID" \
  --query "Addresses[0].[AssociationId, InstanceId, PublicIp]" \
  --output text)"
[[ "$ASSOC_ID" == "None" ]] && ASSOC_ID=""
[[ "$ASSOC_INST_ID" == "None" ]] && ASSOC_INST_ID=""
[[ "$PUBLIC_IP" == "None" ]] && PUBLIC_IP=""

echo "[bootstrap] EIP alloc=${EIP_ALLOC_ID}, assocInst=${ASSOC_INST_ID:-none}, publicIp=${PUBLIC_IP:-none}, eni=${NETWORK_INTERFACE_ID}"

if [[ -z "$ASSOC_ID" || "$ASSOC_INST_ID" != "$INSTANCE_ID" ]]; then
  echo "[bootstrap] Associating EIP to ENI ${NETWORK_INTERFACE_ID}"
  aws ec2 associate-address --region "$REGION" \
    --allocation-id "$EIP_ALLOC_ID" \
    --network-interface-id "$NETWORK_INTERFACE_ID" \
    --allow-reassociation >/dev/null
fi

PRIVATE_IP=$(aws ec2 describe-instances --region "$REGION" --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].PrivateIpAddress" --output text)
[[ "$PRIVATE_IP" == "None" ]] && PRIVATE_IP=""
echo "[bootstrap] ENI privateIp=${PRIVATE_IP}"

ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name "${ZONE_NAME}." \
  --query "HostedZones[0].Id" --output text | sed 's|/hostedzone/||')
if [[ -z "$ZONE_ID" || "$ZONE_ID" == "None" ]]; then
  echo "[bootstrap] ERROR: Hosted zone '${ZONE_NAME}' not found"
  exit 1
fi

CHANGE_JSON=$(mktemp)
cat > "$CHANGE_JSON" <<EOF
{
  "Comment": "Bootstrap UPSERT ${CLUSTER_RECORD_NAME}.${ZONE_NAME} -> ${PRIVATE_IP}",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${CLUSTER_RECORD_NAME}.${ZONE_NAME}.",
        "Type": "A",
        "TTL": ${TTL},
        "ResourceRecords": [
          { "Value": "${PRIVATE_IP}" }
        ]
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --region "$REGION" \
  --hosted-zone-id "$ZONE_ID" \
  --change-batch "file://$CHANGE_JSON" >/dev/null

echo "[bootstrap] Route53 record '${CLUSTER_RECORD_NAME}.${ZONE_NAME}' -> ${PRIVATE_IP} [TTL=${TTL}]"