/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-3702e1e6'], (function (workbox) { 'use strict';

  /**
  * Welcome to your Workbox-powered service worker!
  *
  * You'll need to register this file in your web app.
  * See https://goo.gl/nhQhGp
  *
  * The rest of the code is auto-generated. Please don't update this file
  * directly; instead, make changes to your Workbox build configuration
  * and re-run your build process.
  * See https://goo.gl/2aRDsh
  */

  importScripts("public/build/workbox-routing.dev.js");
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */

  workbox.precacheAndRoute([{
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  }, {
    "url": "build/workbox-v6.4.2/workbox-background-sync.dev.js",
    "revision": "fb75975ade3a5e04753bfc3f4f8c651d"
  }, {
    "url": "build/workbox-v6.4.2/workbox-background-sync.prod.js",
    "revision": "7954dff135dc62c423e6ce1c565f93d3"
  }, {
    "url": "build/workbox-v6.4.2/workbox-broadcast-update.dev.js",
    "revision": "14209160de7352ad2d7890c06222bc25"
  }, {
    "url": "build/workbox-v6.4.2/workbox-broadcast-update.prod.js",
    "revision": "70c6e243e379056a28c47267bf0a2675"
  }, {
    "url": "build/workbox-v6.4.2/workbox-cacheable-response.dev.js",
    "revision": "ff6ec922db28d412207508d5645e973b"
  }, {
    "url": "build/workbox-v6.4.2/workbox-cacheable-response.prod.js",
    "revision": "bc397dbd6759d2b6108ad83a925db19f"
  }, {
    "url": "build/workbox-v6.4.2/workbox-core.dev.js",
    "revision": "118b846f304ba516683f83a94ed1c2ea"
  }, {
    "url": "build/workbox-v6.4.2/workbox-core.prod.js",
    "revision": "bd8c5b515850c5e39e3e07979fce1c10"
  }, {
    "url": "build/workbox-v6.4.2/workbox-expiration.dev.js",
    "revision": "e4ed7cd46d4c56b5940907977eb4ceed"
  }, {
    "url": "build/workbox-v6.4.2/workbox-expiration.prod.js",
    "revision": "674d39ef831fcefe7a62b28eff4f07fe"
  }, {
    "url": "build/workbox-v6.4.2/workbox-navigation-preload.dev.js",
    "revision": "85988b5cf1e6e4688924d5e45d4f42a3"
  }, {
    "url": "build/workbox-v6.4.2/workbox-navigation-preload.prod.js",
    "revision": "73a7cc035bc2f74f6716a3e9734ae3c5"
  }, {
    "url": "build/workbox-v6.4.2/workbox-offline-ga.dev.js",
    "revision": "e61593fdb0192e691d6e483f588dbfd8"
  }, {
    "url": "build/workbox-v6.4.2/workbox-offline-ga.prod.js",
    "revision": "915b52f0699e87c68f7fe498597baad9"
  }, {
    "url": "build/workbox-v6.4.2/workbox-precaching.dev.js",
    "revision": "a6d05390b35767c20646c98dfea25436"
  }, {
    "url": "build/workbox-v6.4.2/workbox-precaching.prod.js",
    "revision": "70d4d5998468a1fb07c19121866e9363"
  }, {
    "url": "build/workbox-v6.4.2/workbox-range-requests.dev.js",
    "revision": "4fb75eaccbf320c2753ba642222797ad"
  }, {
    "url": "build/workbox-v6.4.2/workbox-range-requests.prod.js",
    "revision": "5dbc94015ac1a7bc5addaf778228d1d8"
  }, {
    "url": "build/workbox-v6.4.2/workbox-recipes.dev.js",
    "revision": "cfc6edb947081f9621d1820f87afc110"
  }, {
    "url": "build/workbox-v6.4.2/workbox-recipes.prod.js",
    "revision": "a15419b66c90e68d39ffc8f9b8b6414a"
  }, {
    "url": "build/workbox-v6.4.2/workbox-routing.dev.js",
    "revision": "9469b821186f34d4ccfe1a60fdfe8b37"
  }, {
    "url": "build/workbox-v6.4.2/workbox-routing.prod.js",
    "revision": "c4a4d3c0c60f701b4dd99caa5d3a3c3e"
  }, {
    "url": "build/workbox-v6.4.2/workbox-strategies.dev.js",
    "revision": "6dff399d1895c0c37bc4560a0bc38ce1"
  }, {
    "url": "build/workbox-v6.4.2/workbox-strategies.prod.js",
    "revision": "d3617339c9b98ec1ac9fbcca979a490c"
  }, {
    "url": "build/workbox-v6.4.2/workbox-streams.dev.js",
    "revision": "2de91cbb5801080f48d89f8af774b975"
  }, {
    "url": "build/workbox-v6.4.2/workbox-streams.prod.js",
    "revision": "81e84999df5aee75d6d509290d594635"
  }, {
    "url": "build/workbox-v6.4.2/workbox-sw.js",
    "revision": "bd5e89e10c1a12dda38900fcd2c55d21"
  }, {
    "url": "build/workbox-v6.4.2/workbox-window.dev.umd.js",
    "revision": "b4406c439c5bcc668587f446acd2c4c2"
  }, {
    "url": "build/workbox-v6.4.2/workbox-window.prod.umd.js",
    "revision": "401c5facd4d7a3ead589542e1ed3a903"
  }, {
    "url": "fallback.html",
    "revision": "77166021a939c914e401eb645e0368ef"
  }, {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  }, {
    "url": "index.html",
    "revision": "f101c9e1c13c177d7361549ce0181334"
  }, {
    "url": "manifest.json",
    "revision": "6e1b845f6122b627d11a494f88a94da2"
  }, {
    "url": "service-worker-copy.js",
    "revision": "f9af1f7e4ff703e069a0848ce5f0ec2b"
  }, {
    "url": "src/css/app.css",
    "revision": "f27b4d5a6a99f7b6ed6d06f6583b73fa"
  }, {
    "url": "src/css/feed.css",
    "revision": "39f4090859e524d18562938bd7dbfd41"
  }, {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  }, {
    "url": "src/js/app.js",
    "revision": "4d264a30b5ae7fef20b77c744528dbe0"
  }, {
    "url": "src/js/domain.js",
    "revision": "2193c778ce8c12a49bf0d6b83317c9fd"
  }, {
    "url": "src/js/feed.js",
    "revision": "c71544f265f88fa00b3562d6acd69396"
  }, {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  }, {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  }, {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  }, {
    "url": "sw-base.js",
    "revision": "7da31958021d3cfab4dadfdf586f25a0"
  }, {
    "url": "sw.js",
    "revision": "a3b42a9bf289f826a4d7aef876828d0f"
  }, {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  }, {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  }, {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  }, {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }], {});

}));
//# sourceMappingURL=service-worker.js.map