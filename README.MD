# Progressive Web Apps - Complete Guide
This source code is part of Maximilian Schwarzmüller's "Progressive Web Apps - Complete Guide" course on udemy.com.

# How to Use
You need [Node.js](https://nodejs.org) installed on your machine. Simply download the installer from [nodejs.org](https://nodejs.org) and go through the installation steps.

Once Node.js is installed, open your command prompt or terminal and **navigate into this project folder**. There, run `npm install` to install all required dependencies.

Finally, run `npm start` to start the development server and visit [localhost:8080](http://localhost:8080) to see the running application.


## Workbox
> New tool to manage service workers
```sh
$ npm install workbox-cli --global
```

### Wizard
> Creates workbox config file
```sh
$ workbox wizard
```

### Generate
> Generate service worker file
([Workbox Config Options])

```sh
$ workbox generateSW
```

### Inject Manifest
> Use a base file to create service worker file
To work fine must use one of this [Bundlers]

```sh
$ workbox injectManifest
```

   [Workbox Config Options]: <https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build?hl=en>

   [Bundlers]: <https://bundlers.tooling.report/>