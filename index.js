const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const contentful = require('contentful')
const mgmt = require('contentful-management')
const bodyParser = require('body-parser');

require('dotenv').config();
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/', (req, res) => {
  const cda = contentful.createClient({space: process.env.SPACE_ID, accessToken: process.env.ACCESS_TOKEN});
  cda.getEntry(req.body.sysId).then(response => {
    res.send(response);
  }).catch(console.error)
})

app.post('/build', (req, res) => {
  const client = mgmt.createClient({accessToken: process.env.PERSONAL, headers: {'X-Contentful-Version': req.body.versionNo}})

  client.getSpace(process.env.SPACE_ID)
  .then((space) => space.getEnvironment('master'))
  .then((environment) => environment.getAsset(req.body.assetId))
  .then((asset) => {
    if (!asset.fields.description) {
      asset.fields.description = {'en-US': ''};
    }

    const des = asset.fields.description['en-US'];
    let description = `${des}`;
    const tagWords = ` ${req.body.allTags}`;
    let newDescription = '';

    if (des.includes(tagWords)) {
      return asset;
    } else {
      description = `${des}`;
      newDescription = description.concat(tagWords);
      asset.fields.description['en-US'] = newDescription
      return asset.update()
    }
  })
  .then((asset) => {
    if (asset.isUpdated()) {
      return asset.publish()
    } else {
      return asset;
    }
  })
  .then((asset) => {
    if (asset.isPublished()) {
      res.send(asset);
      return asset;
    }
  })
  .catch(console.error)
})

app.listen(port, function () {
  console.log('CORS-enabled web server listening on port 3000')
})
