
This is a tutorial to set up a Node app with Mongo and Docker.

## Introduction

This is a very simple tutorial to build a trivial Node app backed up by a MongodB store, where the Node application is running in a Docker container running Ubuntu, and the MongodB backend is in its own container, also running on Ubuntu, linked to the Node app container so that its ports are not exposed.  We will place the source files for the application on the host running Mac OS and mount that directory in the container running the Node app so that we can easily edit and update the app.  We also map a local directory to the mongo container so we can `mongoimport` some json data to the mongo store.

These instructions are for Mac OS X.  The instructions should work on Linux as well, except on Linux, you don't need to worry about any of the `boot2docker` business since Docker serer runs natively on the OS.  To access the app at the end, just substitute `localhost` for `dockerhost`.

### Installation

Make sure you have Docker installed.  It is a very straightforward process covered in the [Docker Installation](https://docs.docker.com/installation/) section.

For convenience, make sure you have created an entry in `/etc/hosts` for the `boot2docker` host with :

`echo $(docker-ip) dockerhost | sudo tee -a /etc/hosts`

or directly editing the `/etc/hosts` file and putting in an IP addres for `dockerhost` as obtained from typing `boot2docker ip` in the shell.

#### Directories and Files

The directory and file structure is as follows
<pre>
work
  /nodemongo
     Dockerfile # mongodb image
     /json
        people.json # mongoimport into mongo
     /src
        nodemongo.js # actual app
        /views             # swig templates
           badRequest.html # response to /
           hello.html      # response to /valid-name
           notfound.html   # response to /invalid-name
</pre>
<br>
We will mount the `~/..path../work/nodemongo` directory to `/nodemongo` in our `node` container.

> Note that the above directory structure MUST be under `/Users` for the file mount to work, as of Docker 1.5

You can download this from <a href="https://github.com/caasjj/nodemongodocker.git" target="_blank">caasjj/nodemongodocker</a>

#### Create a MongoDB Container

We are going to create the Mongo Container from a Dockerfile, just to get a feel for the process.

First, clone the project and cd into `/nodemongo` and issue the command 

Step 1 --> `docker build --tag <yourname>/<image-name>:<tag> .`

where `yourname` is your user name and `image-name` is the name you want to give to the image and `tag` is also a short string to tag/version the image.  My command is 

`docker build --tag caasjj/mongo .`

Once you get the prompt back, type:

`docker images`

and you should see your image ready to generate a container.

Now, create a container to run Mongo:

Step 2 --> `docker run -v <path-to-json>:/json -d --name mongo <yourname>/<image-name>:<tag>`

On my computer, I issue the command:

`docker run -v ~/Coding/Docker/nodemongo/json:/json -d --name mongo caasjj/mongo`


> If you wanted to expose Mongo's port so you could access it, you'd type <br> `docker run -d -v <port-num>:27017 --name mongo <yourname>/<image-name>:<tag>` <br>
where the new field, `<port-number>` is the port you want to expose Mongo on in your *host computer*.  You could then connect to the Mongo instance with <br> `mongo --host $(boot2docker ip) --port <port-num>`


You can confirm that no ports are exposed by the response from `docker ps` - `PORTS` has no `->` mapping:

<pre>
CONTAINER ID    IMAGE                  COMMAND               CREATED          STATUS          PORTS        NAMES
8a8e97d0c964    caasjj/mongo:latest    /bin/sh -c usr/bin/   3 minutes ago    Up 3 minutes    27017/tcp    mongo
</pre>

Since we are not exposing any of the ports, the only way we can verify that Mongo is running is by logging into the machine with :

Step 3. --> `docker exec -it mongo bash`

This will log you into the container running Mongo and the prompt will switch to something like `root@<container-id>:/#`.  Now, you can just run the mongo shell with `mongo` and see that you are in fact accessing an empty Mongo database.  So, let's use `mongoimport` to import out `people` collection from `json/people.json`

Step 4. --> `mongoimport -c people -d docker --jsonArray --file /json/people.json`


### Create the NodeJS Container

Creating the node container is actually very simple, because we are going to use a prepackaged image:

Step 1 --> `docker run -d -p 49160:8001 -v ~/<parent-path>/nodemongo:/nodemongo --name nodemongo --link mongo:alias node node /nodemongo/src/nodemongo.js`

On my computer, this command is:

 `docker run -d -p 49160:8001 -v ~/Coding/Docker/nodemongo:/nodemongo --name nodemongo --link mongo:alias node node /nodemongo/src/nodemongo.js`

Here, we are creating a container from the `node` image, and executing the command `node /nodemongo/src/nodemongo.js` on it. We are mapping the application's port `8001` to `boot2docker`'s port `49160`, so the app will be available at `http://dockerhost:49160`.
  
The directory `/nodemongo` in the container is mounted using `-v ~/Coding/Docker/nodemongo:/nodemongo`.

The key step is in the linking via `--link mongo:alias`, where we link the `mongo` container to our `mongonode` container with an alias of `alias` - which is why we obtain the mongo host IP from `process.env.ALIAS_PORT` (See **Environment Variables** in [Docker Links](http://docs.docker.com/userguide/dockerlinks/) ). 

### Test the App

Now, if you use curl or a browser to GET from `http://dockerhost:41960/<valid-name>`, where `valid-name` corresponds to any name in `people.json`, you should get a `Hello` message.  If the name does not exist, you will get a `Can't find` message.  If you don't give a name at all, you'll get a message that says to provide a name.

# References
[1] [Using Docker with Mac OS X](http://viget.com/extend/how-to-use-docker-on-os-x-the-missing-guide)

[2] [Dockerfile Reference](http://docs.docker.com/reference/builder/)

[3] [Docker 1.3 Changes](https://blog.docker.com/2014/10/docker-1-3-signed-images-process-injection-security-options-mac-shared-directories/)

[1]: http://viget.com/extend/how-to-use-docker-on-os-x-the-missing-guide "Using Docker with Mac OS X"

[2]: http://docs.docker.com/reference/builder/ "Dockerfile Reference" 

























