# Canada Post API

![Test Status](https://github.com/t3rminus/canada-post/actions/workflows/node.js.yml/badge.svg) [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat)](https://github.com/standard/semistandard)

Fairly straightforward wrapper for the Canada Post API. Forked from [t3rminus/canada-post](https://github.com/t3rminus/canada-post) to add contract shipments and update dependencies.

Handles basic rating, creating shipments, and tracking.

[![NPM](https://nodei.co/npm/canadapost-api-alt.png)](https://nodei.co/npm/canadapost-api-alt/)

# Documentation

[API Documentation](https://github.com/crowselectromusic/canadapost-api/blob/master/API.md) is available [here](https://github.com/crowselectromusic/canadapost-api/blob/master/API.md).

## Credentials

To authenticate with canada post you need to create a developer account. Once you've done that they'll give you a username and password that are a string of numbers and letters:

- For users of this library, put those into the `new CanadaPostClient($USERNAME, $PASSWORD, $CUSTOMER_NUMBER);`
- For development use, put those in a .env file in the root of the repo (`CPC_USERNAME`, `CPC_PASSWORD`, `CPC_CUSTOMER`).

If you forget to put your customer number in, you'll probably get 404 errors for some endpoints.

## Changes
### v2.0 - 2025-04-30
- Node v18.0 is now the minimum required version