# docs

This application was scaffolded using the default webpack [Sapper](https://github.com/sveltejs/sapper) template.

## Deploying to IBM Cloud

Deploy to IBM Cloud using the Staticfile buildpack.

### Log in

Log in using the IBM Cloud CLI:

```sh
ibmcloud login

# if using Single-Sign On (SSO):
ibmcloud login --sso
```

### Deploy

```sh
yarn build
ibmcloud target --cf
ibmcloud cf push
```