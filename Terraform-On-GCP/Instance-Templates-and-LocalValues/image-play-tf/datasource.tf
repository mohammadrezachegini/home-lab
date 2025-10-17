data "google_compute_image" "my_image"{
    project = "debian-cloud"
    family= "debian-12"
}



output "vmimage_info" {
    value = {
        id = data.google_compute_image.my_image.id
        self_link = data.google_compute_image.my_image.self_link
        name = data.google_compute_image.my_image.name
        family = data.google_compute_image.my_image.family
        image_id = data.google_compute_image.my_image.image_id
        status = data.google_compute_image.my_image.status
        licenses = data.google_compute_image.my_image.licenses
        description = data.google_compute_image.my_image.description
        project = data.google_compute_image.my_image.project
        source_image_id = data.google_compute_image.my_image.source_image_id


    }
  
}