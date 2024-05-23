const app = require('./app');
const {port} = require('../config/config')

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
