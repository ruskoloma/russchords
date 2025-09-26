# **russchords**

This is a full-stack web application designed to help my church music band organize and perform worship more easily. The application allows for saving and managing song chords, utilizing an existing database of songs from the popular Slavic portal, HolyChords. It also serves as a comprehensive portfolio project showcasing modern cloud-native development, DevOps practices, and infrastructure automation.

## **Live Access & Credentials**

You can explore the live project using the following read-only credentials and links.

### **Application Demo**

Use the provided account with pre-filled data.

* **URL:** [https://russchords.app](https://russchords.app)  
* **Email:** guest@russchords.pro  
* **Password:** Noth!ngJustHangingAr0und

### **CI/CD Pipeline**

The Jenkins instance is publicly viewable for anyone interested in the CI/CD setup.

* **URL:** [https://jenkins.russchords.app](https://jenkins.russchords.app) (Read-only anonymous access)

### **AWS Console (Read-Only)**

A read-only IAM user is available for hiring managers to review the underlying AWS infrastructure.

1. **Go to:** [AWS Console Login](https://466279485288.signin.aws.amazon.com/console?region=us-west-2)  
2. **Username:** prod-guest  
3. **Password:** Noth!ngJustHangingAr0und  
4. **Region:** us-west-2

**What you can explore:**

* EC2, ECS (backend API), RDS (PostgreSQL), DynamoDB (caching), Lambda, CloudFront, S3, Route53, and the VPC networking setup.

## **Technology Stack**

This project is built with a modern, cloud-native technology stack. The key technologies are highlighted below.

### **Frontend**

* **React 19** with TypeScript  
* **Vite** for a fast development experience  
* **Mantine UI** for the component library  
* **SWR** for data fetching and caching  
* **OpenID Connect (OIDC)** for authentication

### **Backend**

* **.NET 8** with ASP.NET Core for the Web API  
* **Entity Framework Core** as the ORM  
* **PostgreSQL** as the primary relational database  
* **Swagger/OpenAPI** for API documentation

### **Cloud Infrastructure & DevOps (AWS)**

* **Containerization:** **Docker** images orchestrated with **Amazon ECS**.  
* **Infrastructure as Code:** **Terraform** to define and manage all AWS resources.  
* **CI/CD:** **Jenkins** for orchestrating automated builds and deployments.  
* **Configuration Management:** **Ansible** for server configuration.  
* **Core AWS Services:**  
  * **Compute:** ECS, Lambda  
  * **Storage:** S3, RDS for PostgreSQL, DynamoDB  
  * **Networking:** VPC, Route 53, CloudFront (CDN)  
  * **Security:** IAM, Cognito, ACM

## **Architecture Overview**

The application is architected as a container-based system running on AWS. The backend API is deployed as a service on an ECS cluster, communicating with a managed RDS PostgreSQL database. The frontend is a single-page application built with React, hosted on S3, and delivered globally via CloudFront.  
The entire infrastructure is managed as code using Terraform, and the deployment process is fully automated with a Jenkins CI/CD pipeline.