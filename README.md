<img width="200" alt="twitch" src="https://github.com/Durss/multiblindtest/blob/master/front_src/assets/icons/home_logo_outlined.svg">

# Multi Blindtest

Web app to play a multi blindtest.\
It's ike a classic blind test but instead of hearing one track you hear up to 6 at the same time.

When you find a track it's stopped so you can hear the other better.

Check it out live at :\
https://multiblindtest.com

Challenge your friends with the multiplayer mode !



## Project setup
```
npm install
```

Install PM2 globally (will run the script as a service) :
```
npm i -g pm2
```

### Compile front with hot-reloads for development
```
npm run front/serve
```

### Compile front for production
```
npm run front/build
```

### Compile server with hot-reloads for development
```
npm run server/watch
```

### Compile server for production
```
npm run server/build
```

### Shortcut for developpement
```
npm run dev
``` 
Starts front and server with hot reload.\
Node process has to be started manually. See [Starting services section](#starting-services).

### Compile server+front for production
```
npm run build
``` 


### Starting services
Execute this inside project folder's root
```
pm2 start bootstrap-pm2.json
```

To view process logs via PM2, execute :
```
pm2 logs --raw MultiblindTest
```

## Start on boot (DOESN'T work on windows)
First start the client as explained above.  
Then execute these commands:
```
pm2 save
pm2 startup
```
Now, the service should automatically start on boot 
 
 
<img width="200" alt="twitch" src="https://github.com/Durss/multiblindtest/blob/master/front_src/assets/icons/twitch.svg">

## Build for Twitch Extension
To build the project so it works on twitch hosting services the files must all have relative PATHS.
Problem is this is incompatible with the "history" mode of the router used by the actual website.
Before building for twitch the following line must be uncommented on the **vue.config.js** file:
```
publicPath: './',
```
