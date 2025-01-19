const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve the static files in the directory
app.use(express.static(path.join(__dirname)));

app.use(express.static(path.join(__dirname, 'public')));


// Default route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
