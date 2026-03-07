{{/*
=============================================================================
Ecommerce Platform - Template Helpers
=============================================================================
*/}}

{{/*
Chart name
*/}}
{{- define "ecommerce.name" -}}
{{- .Chart.Name }}
{{- end }}

{{/*
Full release name
*/}}
{{- define "ecommerce.fullname" -}}
{{- .Release.Name }}-{{ .Chart.Name }}
{{- end }}

{{/*
Common labels applied to all resources
*/}}
{{- define "ecommerce.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
{{- end }}

{{/*
Build full image name
Usage: {{ include "ecommerce.image" (dict "registry" .Values.image.registry "image" "product-service" "tag" .Values.image.tag) }}
*/}}
{{- define "ecommerce.image" -}}
{{- if .registry -}}
{{ .registry }}/{{ .image }}:{{ .tag }}
{{- else -}}
{{ .image }}:{{ .tag }}
{{- end -}}
{{- end }}

{{/*
Standard liveness probe for microservices
*/}}
{{- define "ecommerce.livenessProbe" -}}
livenessProbe:
  httpGet:
    path: /health
    port: {{ .port }}
  initialDelaySeconds: {{ .probes.liveness.initialDelaySeconds }}
  periodSeconds: {{ .probes.liveness.periodSeconds }}
{{- end }}

{{/*
Standard readiness probe for microservices
*/}}
{{- define "ecommerce.readinessProbe" -}}
readinessProbe:
  httpGet:
    path: /health
    port: {{ .port }}
  initialDelaySeconds: {{ .probes.readiness.initialDelaySeconds }}
  periodSeconds: {{ .probes.readiness.periodSeconds }}
{{- end }}

{{/*
Standard environment variables for all microservices (DB config)
*/}}
{{- define "ecommerce.dbEnvVars" -}}
- name: DB_HOST
  valueFrom:
    configMapKeyRef:
      name: ecommerce-config
      key: DB_HOST
- name: DB_PORT
  valueFrom:
    configMapKeyRef:
      name: ecommerce-config
      key: DB_PORT
- name: DB_NAME
  valueFrom:
    configMapKeyRef:
      name: ecommerce-config
      key: DB_NAME
- name: DB_USER
  valueFrom:
    secretKeyRef:
      name: ecommerce-secret
      key: DB_USER
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: ecommerce-secret
      key: DB_PASSWORD
- name: NODE_ENV
  valueFrom:
    configMapKeyRef:
      name: ecommerce-config
      key: NODE_ENV
{{- end }}
