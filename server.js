const fs          = require('fs');
const express     = require('express');
const cors        = require('cors');
const compression = require('compression');
const static      = require('serve-static');
const directory   = require('serve-index');

const app = express();

app.use(cors());
app.use(compression({ filter: () => true }));

app.use('/assets', static('./assets'))
app.use('/system', static('./system'))
app.use('/games', static('./games'))

app.use('/', directory('./games'), (req, res) => {
    const file = fs.existsSync(`./bin${req.path}`)
        ? `./bin${req.path}`
        : './bin/index.html';

    res.sendFile(file, { root: __dirname });
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server running on port ${port}`));
