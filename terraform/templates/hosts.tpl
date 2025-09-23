%{ for h in hosts ~}
${h} ansible_user=ec2-user
%{ endfor ~}