# Peer-to-peer remote desktop control and access tool

## Overview

This project introduces a browser-centric web application leveraging peer-to-peer communication for seamless remote desktop access. This project offers an inbrowser remote desktop experience by integrating state-of-the-art technologies including Google’s WebRTC framework, STUN servers, and signaling servers.

## Motivation

In the modern tech environment, remote desktop sharing is very popular and often muchneeded for daily work. Yet, many existing solutions hinge on the conventional client-server model, necessitating additional tools and software for effective desktop access. There exists a notable research gap concerning Desktop-as-a-Service (DaaS) delivery via a peer-to-peer architecture.

## Workflow

![Remote desktop controller architecture and workflow](https://raw.githubusercontent.com/priyangshupal/documentation-images/main/remote-desktop-controller/remote-desktop-control-workflow.svg)

## Setup

This project requires a package manager - `yarn` or `node` is recommended.

To install the dependencies, inside the project directory, run:

```
yarn install
```

## Steps to run

Running the project will be done in two steps:

1. Prepare build files for the React application.

```
yarn build
```

2. Start the electron app

```
yarn electron
```

This will bring up the electron app and serve the react build at PORT 4000. A tunnel may be setup to http://localhost:4000/ to access the application remotely.
The remote application will now be able to access and control the host computer's screen from its browser.

## License

Usage is provided under the [MIT License](https://opensource.org/license/mit). See LICENSE for the full details.
