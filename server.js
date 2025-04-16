const express = require('express')
const axios = require('axios')
const cors = require('cors')
const https = require('https')
const logger = require('./logger')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// 创建自定义 HTTPS 代理
const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // 禁用 SSL 证书验证
})

// 添加请求日志中间件
app.use((req, res, next) => {
    logger.info('收到请求', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    })
    next()
})

// 启用 CORS
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Length', 'X-Proxy-Response'],
        credentials: true,
        maxAge: 86400,
    }),
)

// 动态代理中间件
app.use('/api', async (req, res) => {
    try {
        // 从请求路径中提取目标 URL
        const targetPath = req.path.substring(1) // 移除开头的斜杠

        if (!targetPath) {
            logger.warn('请求缺少目标 URL')
            return res.status(400).json({ error: '请提供目标 URL' })
        }

        // 解析目标 URL
        const targetUrl = !targetPath.startsWith('http') 
            ? `https://www.${targetPath}`
            : targetPath

        logger.info('转发请求', { targetUrl })

        // 准备请求头
        const headers = {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            Host: new URL(targetUrl).hostname,
        }

        // 使用 axios 发送请求
        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: headers,
            data: req.body,
            responseType: 'arraybuffer', // 处理二进制响应
            httpsAgent: httpsAgent, // 使用自定义 HTTPS 代理
            maxRedirects: 5, // 允许重定向
            validateStatus: (status) => status < 500, // 接受所有小于 500 的状态码
        })

        // 设置响应头
        res.set({
            'Content-Type': response.headers['content-type'] || 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'X-Proxy-Response': 'true',
        })

        // 发送响应
        logger.info('请求成功', {
            targetUrl,
            status: response.status,
            contentType: response.headers['content-type']
        })
        res.status(response.status).send(response.data)
    } catch (error) {
        logger.error('请求失败', {
            error: error.message,
            stack: error.stack,
            url: req.url
        })
        if (error.response) {
            res.status(error.response.status).set(error.response.headers).send(error.response.data)
        } else {
            res.status(500).json({
                error: '请求失败',
                message: error.message,
            })
        }
    }
})

// 健康检查端点
app.get('/health', (req, res) => {
    logger.info('健康检查请求')
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT,
    })
})

// 全局错误处理中间件
app.use((err, req, res, next) => {
    logger.error('服务器错误', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    })
    res.status(500).json({
        error: '服务器错误',
        message: err.message,
    })
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', {
        error: error.message,
        stack: error.stack
    })
})

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的 Promise 拒绝', {
        reason: reason.message,
        stack: reason.stack
    })
})

// 启动服务器
app.listen(PORT, () => {
    logger.info('服务器启动', { port: PORT })
})
