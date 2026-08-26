variable "run_service_account" {
  description = "Cloud Run runtime SA that calls Vertex, Speech, and TTS via ADC"
  type        = string
  default     = "317766274600-compute@developer.gserviceaccount.com"
}
