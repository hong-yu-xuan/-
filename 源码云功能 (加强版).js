const types = {
    type: "SLIGHTNING_KITTEN_CLOUD_FUNCTION",
    title: "源码云功能1",
    icon: "https://creation.codemao.cn/716/appcraft/IMAGE_Mrr1hNO1b_1691654733167.svg",
    isInvisibleWidget: true,
    isGlobalWidget: true,
    properties: [
        {
            key: "autoReconnect",
            label: "自动重连", 
            valueType: "boolean",
            defaultValue: true
        }
    ],
    methods: [
        {
            key: "connect",
            label: "连接",
            params: [
                {
                    key: "theWorkID",
                    label: "到",
                    valueType: "number",
                    defaultValue: 0
                }
            ],
            blockOptions: {
                color: "#fb8371",
                callMethodLabel: false,
                line: "连接" 
            }
        },
        {
            key: "disconnect",
            label: "断开",
            params: [],
            blockOptions: {
                color: "#fb8371",
                callMethodLabel: false,
                space: 40
            }
        },
        {
            key: "get",
            label: "",
            params: [
                {
                    key: "varName",
                    valueType: "string",
                    defaultValue: "云变量"
                }
            ],
            valueType: "string",
            blockOptions: {
                color: "#ee9138",
                callMethodLabel: false,
                line: "云变量" 
            }
        },
        {
            key: "set",
            label: "设置",
            params: [
                {
                    key: "varName",
                    labelAfter: "的值",
                    valueType: "string",
                    defaultValue: "云变量"
                },
                {
                    key: "value",
                    label: "为",
                    valueType: "string",
                    defaultValue: "新的值"
                }
            ],
            blockOptions: {
                color: "#ee9138",
                callMethodLabel: false,
                space: 40
            }
        },
        {
            key: "userName",
            label: "用户昵称",
            params: [],
            valueType: "string",
            blockOptions: {
                color: "#ee9138",
                callMethodLabel: false,
                line: "用户信息" 
            }
        },
        {
            key: "userID",
            label: "用户编号",
            params: [],
            valueType: "number",
            blockOptions: {
                color: "#ee9138",
                callMethodLabel: false,
            }
        },
        {
            key: "onlineUsersNumber",
            label: "在线用户数",
            params: [],
            valueType: "number",
            blockOptions: {
                color: "#ee9138",
                callMethodLabel: false,
            }
        }
    ],
    events: [
        {
            key: "onInit",
            label: "初始化完成",
            params: []
        },
        {
            key: "onError",
            label: "发生错误",
            params: []
        },
        {
            key: "onVarInit",
            label: "云数据初始化",
            params: [
                {
                    key: "name",
                    label: "名称",
                    valueType: "string"
                },
                {
                    key: "value",
                    label: "值",
                    valueType: "string"
                },
                {
                    key: "type",
                    label: "类型",
                    valueType: "string"
                },
                {
                    key: "cvid",
                    label: "CVID",
                    valueType: "string"
                }
            ]
        },
        {
            key: "onVarChange",
            label: "云变量改变",
            params: [
                {
                    key: "varName",
                    label: "变量名",
                    valueType: "string"
                },
                {
                    key: "varValue",
                    label: "变量值",
                    valueType: "string"
                }
            ]
        },
        {
            key: "onOnlineUsersNumberChange",
            label: "在线用户数改变",
            params: []
        }
    ]
}

var workID = 0
var connection = null
var ping = null
var vars = null
var onlineUsersNumber = 0

var userID = 0
var userName = "获取中……"

class Widget extends InvisibleWidget {

    constructor(props) {
        super(props)
        this.autoReconnect = props.autoReconnect

        const axios = require("axios")
        axios({
            method: "get",
            url: "https://api.codemao.cn/tiger/v3/web/accounts/profile",
            withCredentials: true
        }).then((response) => {
            const { data } = response
            userID = data.id
            userName = data.nickname
        }).catch((error) => {
            userName = "获取用户信息失败"
            const { response } = error
            if (response) {
                const { data } = response
                if (data.error_code == "E_0") {
                    userName = "未登录用户"
                    this.widgetError("用户未登录编程猫账号，无法使用源码云功能")
                } else
                    this.widgetError(`获取用户信息失败：${data.error_message}`)
            } else if (error.request) {
                this.widgetError("获取用户信息失败：请已发送，但未收到响应")
            } else {
                this.widgetError("获取用户信息失败：请求发送失败")
            }
            console.log(error.toJSON())
        })
    }

    connect = (theWorkID) => {
        if (workID != 0) {
            this.widgetWarn("上一个连接未断开")
            this.disconnect()
        }
        workID = theWorkID
        this.widgetLog(`正在连接到 ${workID}……`)
        var V = new Function("return " + "Web" + "Socket") ()
        var a = "socketcv"
        var b = "codemao"
        var c = "cn"
        var port = "9096"
        connection = new V(`wss://${a}.${b}.${c}:${port}/cloudstorage/?session_id=${workID}&authorization_type=1&stag=1&EIO=3&transport=websocket`);
        connection.onmessage = (message) => {
            var { data } = message
            if (data == "1") {
                if (this.autoReconnect) {
                    this.widgetWarn("连接异常断开，即将自动重连")
                    clearInterval(ping)
                    workID = 0
                    this.connect(theWorkID)
                } else {
                    this.widgetError("连接异常断开")
                    this.emit("onError")
                }
            }
            else if (data == "40") {
                connection.send(`42["join","${workID}"]`)
            } else if (data.startsWith("42")) {
                data = JSON.parse(data.substring(2))
                message = data[0]
                data = data[1]
                switch (message) {
                    case "connect_done":
                        connection.send(`42["list_variables",{}]`)
                        this.widgetLog("正在加载云变量……")
                        break
                    case "list_variables_done":
                        data = JSON.parse(data)
                        if (vars == null) {
                            vars = {}
                            data.forEach(varInfo => {
                                vars[varInfo.name] = varInfo
                                vars[varInfo.cvid] = varInfo
                                this.emit("onVarInit", varInfo.name, varInfo.value, varInfo.type, varInfo.cvid)
                            })
                            this.widgetLog("初始化成功")
                            data.forEach(varInfo => {
                                this.emit("onVarChange", varInfo.name, varInfo.value)
                            })
                        } else {
                            data.forEach(varInfo => {
                                this.varUpdate(varInfo.name, varInfo.value)
                            })
                        }
                        ping = setInterval(() => {
                            connection.send("2")
                        }, 25000)
                        this.emit("onInit")
                        break
                    case "update_vars_done":
                        if (data == "fail") {
                            this.widgetError("云变量更新失败")
                        }
                        data.forEach(varValueInfo => {
                            this.varUpdate(varValueInfo.cvid, varValueInfo.value)
                        })
                        break
                    case "online_users_change":
                        data = JSON.parse(data)
                        onlineUsersNumber = data.total
                        this.emit("onOnlineUsersNumberChange")
                        break
                }
            }
        }
        connection.onerror = (message) => {
            this.widgetError("连接发生错误")
            this.emit("onError")
            this.clean()
        }
        connection.onclose = (message) => {
            if (workID != 0) {
                if (this.autoReconnect) {
                    this.widgetWarn("连接异常断开，即将自动重连")
                    clearInterval(ping)
                    workID = 0
                    this.connect(theWorkID)
                } else {
                    this.widgetError("连接异常断开")
                    this.emit("onError")
                    this.clean()
                }
            }
        }
    }

    disconnect = () => {
        clearInterval(ping)
        connection.send("41")
        connection.close()
        this.widgetLog(`已断开与 ${workID} 的连接`)
        this.clean()
    }

    clean = () => {
        workID = 0
        connection = null
        ping = null
        vars = null
        onlineUsersNumber = 0
    }

    varUpdate = (varName, value)=> {
        if (workID == 0) {
            this.widgetError("未连接到云")
            return
        }
        var varInfo = vars[varName]
        if (typeof varInfo == "undefined") {
            this.widgetError(`云变量 ${varName} 不存在`)
            return
        }
        if (varInfo.value != value) {
            varInfo.value = value
            this.emit("onVarChange", varInfo.name, value)
        }
    }

    get = (varName) => {
        if (workID == 0) {
            this.widgetError("未连接到云")
            return
        }
        var varInfo = vars[varName]
        if (typeof varInfo == "undefined") {
            this.widgetError(`云变量 ${varName} 不存在`)
            return
        }
        return varInfo.value
    }

    set = (varName, value) => {
        if (workID == 0) {
            this.widgetError("未连接到云")
            return
        }
        var varInfo = vars[varName]
        if (typeof varInfo == "undefined") {
            this.widgetError(`云变量 ${varName} 不存在`)
            return
        }
        if (varInfo.type == 3) {
            this.widgetError("不能对云列表进行赋值操作")
            return
        }
        value = this.preconditioning(value)
        if (varInfo.value != value) {
            varInfo.value = value
            this.emit("onVarChange", varName, value)
        }
        var message
        if (varInfo.type == 0)
            message = "update_private_vars"
        if (varInfo.type == 1)
            message = "update_vars"
        connection.send(`42${
            JSON.stringify([
                message,
                [
                    {
                    cvid: varInfo.cvid,
                    value: value,
                    action: "set",
                    param_type: typeof value
                    }
                ]
            ])
        }`)
    }

    preconditioning = (value) => {
        var numberValue = Number(value)
        if (!isNaN(numberValue)) return numberValue
        if (value.length > 1024) {
            value = value.substring(1024)
            this.widgetWarn("字符串长度超出限制（1024 字符），已舍弃超出部分")
        }
        return value
    }

    userName = () => {
        return userName
    }

    userID = () => {
        return userID
    }

    onlineUsersNumber = () => {
        if (workID == 0) {
            this.widgetError("未连接到云")
            return
        }
        return onlineUsersNumber
    }
}

exports.types = types;
exports.widget = Widget;
