const express = require('express');
const dotenv = require('dotenv');
const cookieParser=require('cookie-parser');
const connectDB = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet'); 
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const {sendNoti} = require('./utils/sendNoti.js');
const cron = require('node-cron');

// cors
const cors = require('cors');

//Load env vars
dotenv.config({path:'./config/config.env'});

//Connect to database 
connectDB().then(() => {
    sendNoti(); //send noti for testing
});

//Route files
const providers = require('./routes/providers');
const auth = require('./routes/auth');
const bookings = require('./routes/bookings');

const app = express();

//bright do
app.use(cors());

//Body parser
app.use(express.json());

//Cookie parser
app.use(cookieParser());

//Sanitize data
app.use(mongoSanitize());

//Set security header
app.use(helmet());

//Prevent xss
app.use(xss());

//Rate limiting
const limiter = rateLimit({
    windowMs:10*60*1000,
    max: 10000
});
app.use(limiter);

const swaggerOptions={
    swaggerDefinition:{
        openapi: '3.0.0',
        info: {
            title: 'Library API',  
            version: '1.0.0',
            description: 'A simple Express VacQ API'
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1'
            }
        ],
    },
    apis:['./routes/*.js'],
    };
const swaggerDocs=swaggerJsDoc(swaggerOptions);
app.use('/api-docs',swaggerUI.serve, swaggerUI.setup(swaggerDocs));

//add schedule task
cron.schedule('*/5 * * * *',sendNoti); // every five minute

//Mount routers
app.use('/api/v1/providers', providers);
app.use('/api/v1/auth', auth);
app.use('/api/v1/bookings', bookings);

// Create HTTP server and attach socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Expose io to other files if needed
app.set('io', io);

// Socket.IO events
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected`);
    });
});

const PORT=process.env.PORT || 5000;
server.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

//Handle unhandled promise rejections
process.on('unhandledRejection',(err,promise)=>{
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    server.close(()=>process.exit(1));
});