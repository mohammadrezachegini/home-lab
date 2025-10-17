resource "kubernetes_Service_account_v1" "irsa_demo__sa" {
    depends_on = [aws_iam_role_policy_attachment.irsa_iam_role_policy_attach]
    metadata {
        name = "irsa-demo-sa"
        annotations = {
            "eks.amazonaws.com/role-arn" = aws_iam_role.irsa_iam_role.arn
        }
    }
}