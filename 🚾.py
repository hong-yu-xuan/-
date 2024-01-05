import random  
import time  
import requests  
from bs4 import BeautifulSoup  
import re  
import json

def get_account():  
    id = ''.join([str(random.randint(0, 9)) for _ in range(5, 11)])  
    print("获取账号为：", "https://shequ.codemao.cn/user/" + id)

    while True:  
        try:  
            response = requests.get("https://shequ.codemao.cn/user/" + id, timeout=5)  
            if response.status_code == 200:  
                print("状态码 200 获取成功")  
                break  
            else:  
                print("请求失败，状态码：", response.status_code)  
                time.sleep(0.5)  
        except requests.exceptions.RequestException as e:  
            print("请求异常：", e)  
            time.sleep(0.02)

    phone = ''.join([str(random.randint(0, 9)) for _ in range(11)])  
    print("获取手机号：", phone)dsfs

    password = ''.join([random.choice("abcdefghijklmnopqrstuvwxyz") for _ in range(8)])  
    print("账号密码：", password)

    js_code = ''.join([random.choice("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for _ in range(16)])  
    print("Your Token：", js_code)

    print("正在逆向 JS 代码...")  
    time.sleep(0.5)

    print("正在伪造 IP 地址...")  
    time.sleep(0.5)

    print("绕过后端验证中...")  
    time.sleep(0.5)

    print("正在解析数据中...")  
    time.sleep(0.5)

if __name__ == "__main__":  
    while True:  
        get_account()  
        time.sleep(0.01)