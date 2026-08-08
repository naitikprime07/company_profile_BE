# Cloudflare R2 resume uploads

Create an R2 bucket and an R2 API token with **Object Read & Write** access scoped
to that bucket. Add the values shown in `.env.example` to the backend environment.
Never add R2 credentials to the frontend environment.

`R2_PUBLIC_URL` must be the bucket's public custom domain (recommended) or its
enabled `r2.dev` URL, without a trailing slash.

Configure this CORS policy on the R2 bucket, replacing the production origin:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://www.your-frontend-domain.com"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The upload flow is:

1. The frontend sends file metadata to `POST /api/applications/resume-upload-url`.
2. The backend returns a five-minute presigned R2 `PUT` URL and final file URL.
3. The frontend sends the file directly to R2.
4. The frontend submits the application with only `resumeUrl`.
5. The backend verifies that `resumeUrl` belongs to the configured R2 public URL.

Accepted files are PDF, DOC, and DOCX up to 5 MB.
