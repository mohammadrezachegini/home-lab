module.exports = {
    // EXPIRES_IN: new Date().getTime() + 20000,
    MongoIDPattern: /^[0-9a-fA-F]{24}$/,
    ROLES : Object.freeze({
        USER : "USER",
        ADMIN : "ADMIN",
        WRITER : "WRITER",
        TEACHER : "TEACHER",
        SUPPLIER : "SUPPLIER"
    }),
    PERMISSIONS : Object.freeze({
        USER : ["profile"],
        ADMIN : ["all"],
        SUPERADMIN : ["all"],
        CONTENT_MANAGER :[ "course", "blog", "category", "product"],
        TEACHER :[ "course", "blog"],
        SUPPLIER : ["product"],
        ALL : "all"
    }),
    ACCESS_TOKEN_SECRET_KEY : "973e2f4ad0224fb002146f4726548ebaffe6865f4733e7d7614d5a4d6b6b4b2a",
    REFRESH_TOKEN_SECRET_KEY: "1ccdd06043d2b2564b8f166dd37edf6fb67a0643e3e29c2f8183bbc225bf8889"
}