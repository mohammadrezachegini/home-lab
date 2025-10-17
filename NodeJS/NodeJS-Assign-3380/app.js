
const express = require('express');
const app = express();

const records = require('./record');

app.use(express.json());


app.get('/users', async (req, res)=>{
    const users = await records.getUsers();
    res.json(users);
});
// Send a 


app.listen(3000, () => console.log('Quote API listening on port 3000!'));
