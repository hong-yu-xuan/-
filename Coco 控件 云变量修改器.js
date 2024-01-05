const types = {
    type: "SLIGHTNING_CLOUDSTORAGE",
    title: "源码云存储",
    icon: "https://creation.codemao.cn/716/appcraft/IMAGE_Mrr1hNO1b_1691654733167.svg",
    isInvisibleWidget: true,
    isGlobalWidget: true,
    properties: [],
    methods: [
        {
            key: "connect",
            label: "连接",
            params: [
                {
                    key: "workID",
                    label: "到",
                    valueType: "number",
                    defaultValue: 0,
                }
            ],
            blockOptions: {
                color: "#f6a920",
                callMethodLabel: false,
            }
        },
        {
            key: "disconnect",
            label: "断开",
            params: [],
            blockOptions: {
                color: "#f6a920",
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
                    defaultValue: "云变量",
                }
            ],
            valueType: "string",
            blockOptions: {
                color: "#f6a920",
                callMethodLabel: false,
            }
        },
        {
            key: "setString",
            label: "设置",
            params: [
                {
                    key: "varName",
                    labelAfter: "的值",
                    valueType: "string",
                    defaultValue: "云变量",
                },
                {
                    key: "value",
                    label: "为",
                    valueType: "string",
                    defaultValue: "字符串",
                }
            ],
            blockOptions: {
                color: "#f6a920",
                callMethodLabel: false,
            }
        },
        {
            key: "setNumber",
            label: "设置",
            params: [
                {
                    key: "varName",
                    labelAfter: "的值",
                    valueType: "string",
                    defaultValue: "云变量",
                },
                {
                    key: "value",
                    label: "为",
                    valueType: "number",
                    defaultValue: 0,
                }
            ],
            blockOptions: {
                color: "#f6a920",
                callMethodLabel: false,
            }
        }
    ],
    events: [
        {
            key: "onConnect",
            label: "连接完成",
            params: []
        },
        {
            key: "onError",
            label: "发生错误",
            params: []
        },
        {
            key: "onUpdate",
            label: "云变量更新",
            params: [
                {
                    key: "varName",
                    label: "变量名",
                    valueType: "string",
                },
                {
                    key: "varValue",
                    label: "变量值",
                    valueType: "string",
                }
            ]
        }
    ]
}

var connection
var ping
var vars

class Widget extends InvisibleWidget {

    constructor(props) {
        super(props)
    }

    connect = (workID) => {
        connection = new WebSocket(`wss://socketcv.codemao.cn:9096/cloudstorage/?session_id=${workID}&authorization_type=1&stag=1&EIO=3&transport=websocket`);
        connection.onmessage = (message) => {
            var { data } = message
            if (data == "40") {
                connection.send(`42["join","${workID}"]`)
            } else if (data.startsWith("42")) {
                data = JSON.parse(data.substring(2))
                message = data[0]
                data = data[1]
                switch (message) {
                    case "connect_done":
                        connection.send(`42["list_variables",{}]`)
                        break
                    case "list_variables_done":
                        data = JSON.parse(data)
                        vars = {}
                        data.forEach(varInfo => {
                            vars[varInfo.name] = varInfo
                            vars[varInfo.cvid] = varInfo
                            this.emit("onUpdate", varInfo.name, varInfo.value)
                        })
                        ping = setInterval(() => {
                            connection.send("2")
                        }, 25000)
                        this.emit("onConnect")
                        break
                    case "update_vars_done":
                        if (data == "fail") {
                            this.widgetError("云变量更新失败")
                        }
                        data.forEach(varValueInfo => {
                            var varInfo = vars[varValueInfo.cvid]
                            varInfo.value = varValueInfo.value
                            this.emit("onUpdate", varInfo.name, varInfo.value)
                        })
                        break
                }
            }
        }
    }

    disconnect = () => {
        connection.send("41")
        connection.close()
        clearInterval(ping)
    }

    get = (varName) => {
        return vars[varName].value
    }

    setString = (varName, value) => {
        this.set(varName, value)
    }

    setNumber = (varName, value) => {
        this.set(varName, value)
    }

    set = (varName, value) => {
        var varInfo = vars[varName]
        if (typeof varInfo == "undefined") {
            this.widgetError(`云变量 ${varName} 不存在`)
            return
        }
        if (varInfo.type == 3) {
            this.widgetError("不能对云列表进行赋值操作")
            return
        }
        varInfo.value = value
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

    repeatCall = (n, param) => {
        for(let i = 1; i <= n; i++) {
            this.emit("onCall", param, i)
        }
    }
}

exports.types = types;
exports.widget = Widget;
