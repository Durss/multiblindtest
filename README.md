# Multiblind Test

Web app to play a multiblind test.
Like a classic blind test but instead of hearing one track you hear 6 at the same time and you have to recognize songs.
When you find one it's stopped so you can hear the other better.

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