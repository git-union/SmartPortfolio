variable "domain_name" {
  type        = string
  description = "The domain name for the website"
}

variable "environment" {
  type        = string
  description = "The deployment environment (e.g., prod, staging)"
  default     = "prod"
}

variable "aws_region" {
  type        = string
  description = "The AWS region to deploy to"
  default     = "us-east-1"
} 