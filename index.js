var http = require('http');
const express = require('express')
const httpProxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const {pool} = require('./config')
const app = express()
app.use(bodyParser.json())
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const helmet = require('helmet');

//const pecasServiceProxy = httpProxy('http://localhost:3002');
const pecasServiceProxy = httpProxy('https://pecas-api.herokuapp.com/');

const ola = (request, response, next) => {
    
        response.status(200).json("teaaetaet")
    
}

const login = (request, response, next) => {

    const {usuario, senha} = request.body

    pool.query('SELECT * FROM usuarios where usuario = $1 and senha = $2', 
    [usuario, senha], (err, results) =>{
        if(err || results.rowCounts == 0){
            return response.status(401).json({auth: false , message: 'Usuário ou senha inválido'});
        }
        console.log(results)
        const nome_usuario = results.rows[0].usuario;
        const token = jwt.sign( { nome_usuario }, process.env.SECRET, {
            expiresIn: 300
        })
        return response.json({auth: true , token: token});
    })
}

function verificaJWT(request, response, next) {
    const token = request.headers['x-access-token']
    if(!token)return response.status(401).json({auth : false , message : 'nenhum token valido'})
    jwt.verify(token, process.env.SECRET, function(err, decoded){
        if(err) return response.status(500).json({auth : false , message : 'erro ao autenticar o token'})
        request.userId = decoded.id;
        next();
    });
}

// Proxy request
// rota para produtos e todos os métodos
app.all('/pecas', verificaJWT, (req, res, next) => {
    pecasServiceProxy(req, res, next);
})
// rota para produtos e todos os métodos com um parâmetro ID
app.all('/pecas/:id',  verificaJWT, (req, res, next) => {
    pecasServiceProxy(req, res, next);
})

app
.route("/ola")
.post(ola)

app
.route("/login")
.post(login)

app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

var server = http.createServer(app);
server.listen(3000);