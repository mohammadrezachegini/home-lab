const notFound = (res) => {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.write(JSON.stringify({message: "NotFound"}))
    res.end()
}

const ErrorHandlerController = {
    notFound
}

module.exports = ErrorHandlerController