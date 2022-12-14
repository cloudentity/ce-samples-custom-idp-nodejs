var createError = require('http-errors');
var express = require('express');
const handlebars = require('hbs');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
var indexRouter = require('./routes/index');

var session = require('express-session');

var app = express();

app.set('view engine', 'hbs');

var port = process.env.PORT;
console.log('listening on http://localhost:' + port + '/');

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// parse application/json
app.use(bodyParser.urlencoded({extended: true}));;
app.use(bodyParser.json());


app.use(session({secret: 'ssssffff',  saveUninitialized: true,
resave: false}));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
