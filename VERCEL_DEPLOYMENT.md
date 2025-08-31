# Vercel Deployment Guide

This guide will help you deploy the SCB Restaurant Finder application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install with `npm i -g vercel`
3. **GitHub Repository**: Your code should be pushed to GitHub

## Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Set Environment Variables

You need to set up two environment variables in Vercel:

### Option A: Using Vercel CLI

```bash
# Set the certificate password
vercel env add SCB_CERT_PASSWORD

# Set the base64 encoded certificate
vercel env add SCB_CERT_BASE64
```

### Option B: Using Vercel Dashboard

1. Go to your project in the Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

**SCB_CERT_PASSWORD**
- Value: `46LQjVK6c5AB`
- Environment: Production, Preview, Development

**SCB_CERT_BASE64**
- Value: (The long base64 string from the encode-certificate.js output)
- Environment: Production, Preview, Development

## Step 4: Deploy

### Option A: Using Vercel CLI

```bash
vercel --prod
```

### Option B: Using GitHub Integration

1. Connect your GitHub repository to Vercel
2. Push changes to your main branch
3. Vercel will automatically deploy

## Step 5: Verify Deployment

1. Check that your application is accessible at the provided URL
2. Test the search functionality
3. Verify that Excel downloads work

## Troubleshooting

### Common Issues

1. **Certificate Error**: Make sure both environment variables are set correctly
2. **API Errors**: Verify that the SCB API is accessible from Vercel's servers
3. **File System Errors**: The application is designed to work without file system access

### Environment Variables Check

You can verify your environment variables are set correctly by checking the Vercel dashboard or using:

```bash
vercel env ls
```

## Local Development

For local development, you can still use:

```bash
npm start
```

The application will automatically detect the local environment and use the certificate file instead of the base64 encoded version.

## Security Notes

- The certificate password and base64 encoded certificate are stored securely in Vercel's environment variables
- These values are encrypted and not exposed in the client-side code
- The certificate file itself is not uploaded to Vercel
