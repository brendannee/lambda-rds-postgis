# Lambda RDS PostGIS

This is an [Amazon Lambda](http://aws.amazon.com/lambda/) function written in node.js that accepts an array of [encoded polylines](https://developers.google.com/maps/documentation/utilities/polylinealgorithm) and returns a list of US counties that they intersect.  The response also includes the US state for each county.

For example, you can turn this:

    ["cqepF~dgzUd@~BqDvA_C|@qCdAmBx@YLORg@sC[kB{Bz@yChAwEzAoC~@{@^m@P"]

into this:

    [
      {
        "county": "Washoe",
        "state": "Nevada",
        "id": "32031"
      }
    ]

This function depends on an external PostGIS database of counties to do the lookup.  This database could be hosted on [Amazon RDS](http://aws.amazon.com/rds/) or anywhere else you'd like.

With [Amazon API Gateway](http://aws.amazon.com/api-gateway/), it's easy to expose this as an API microservice.  This could allow a website to access this function via a POST request.

This project uses [Amazon Lambda](http://aws.amazon.com/lambda/), [Amazon RDS](http://aws.amazon.com/rds/), [Amazon API Gateway](http://aws.amazon.com/api-gateway/) and [PostGIS](http://postgis.net/).

## Setup

### Collect Data
Download [US Counties](https://www.census.gov/geo/maps-data/data/cbf/cbf_counties.html)

Download [US States](https://www.census.gov/geo/maps-data/data/cbf/cbf_state.html)

### Setup database

Create a postgres database called `counties`

    CREATE DATABASE counties;

Enable POSTGIS:

    CREATE EXTENSION postgis;

This database could be created on [Amazon RDS](http://aws.amazon.com/rds/).  Follow [these steps to create a database on Amazon RDS](http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html).

### Import Data

Using `shp2pgsql`.

County:

    shp2pgsql -W LATIN1 -d -s 4269 cb_2014_us_county_500k/cb_2014_us_county_500k counties | psql -U username -h host counties

State:

    shp2pgsql -W LATIN1 -d -s 4269 cb_2014_us_state_500k/cb_2014_us_state_500k states | psql -U username -h host counties

### Create Configuration File

Copy `config-sample.json` to `config.json`.  Add your postgres credentials as `POSTGRES_URL` in `config.json`.

### Upload code to Amazon Lambda

Zip the project:

    sh build.sh

This will create a file called `process.zip` that you can upload to Amazon Lambda.

### Create an API Endpoint

If you want to be able to access this via HTTP POST, [create an Amazon API Gateway endpoint](http://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started.html).

If you want to be able to access this endpoint from the browser, [enable CORS](http://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html).  

## Example request

Add your Amazon API Gateway endpoint

    curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '["cqepF~dgzUd@~BqDvA_C|@qCdAmBx@YLORg@sC[kB{Bz@yChAwEzAoC~@{@^m@P","qq`nFvv~yU@{FcGAyKAkF?sCABdDA|F@rAw@AeA?iDAkHAuXI}DBIKc@@{ALiBZuAZ{Bt@sAj@kB~@yKpFyIrEcI~DyIpEkCtAqAp@IEGmM@sByB@iE?{IG]|@?xF?vB@xG?pHDn@pHwDtAs@"]' https://1vcbxgt3at.execute-api.us-east-1.amazonaws.com/prod

Response:

    [
      {
        "county": "Washoe",
        "state": "Nevada",
        "id": "32031"
      },
      {
        "county": "Carson City",
        "state": "Nevada",
        "id": "32510"
      }
    ]
