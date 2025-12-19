<template>
	<view class="page-container">
		<!-- 顶部标题栏 -->
		<view class="title-bar">
			<text class="title-text">海丝文化助手-小默</text>
			<button class="close-btn" @click="closePage">×</button>
		</view>

		<!-- 初始提示弹窗 -->
		<view class="popup" v-if="showPopup">
			<view class="popup-content">
				<text class="popup-desc">你好呀！我是海丝文化助手，有什么关于海丝文化的问题都可以问我。</text>
			</view>
		</view>

		<!-- 聊天记录区域 -->
		<scroll-view class="chat-content" scroll-y="true" :scroll-top="scrollTop">
			<!-- 用户消息 -->
			<view class="msg-item user-item" v-for="(item, idx) in chatList" :key="idx" v-if="item.role === 'user'">
				<view class="msg-bubble user-bubble">
					{{ item.content }}
				</view>
			</view>

			<!-- AI消息 -->
			<view class="msg-item ai-item" v-for="(item, idx) in chatList" :key="idx" v-if="item.role === 'ai'">
				<view class="msg-bubble ai-bubble">
					{{ item.content }}
				</view>
			</view>
		</scroll-view>

		<!-- 底部输入区域 -->
		<view class="input-area">
			<input v-model="inputMsg" placeholder="请输入关于海丝文化的问题..." class="msg-input" />
			<button @click="sendMsg" class="send-btn">发送</button>
		</view>
	</view>
</template>

<script>
// 显式导出模块（解决依赖分析识别问题）
module.exports = {
	name: 'AiChatPage'
};

export default {
	name: 'AiChatPage', // 页面名称标识
	data() {
		return {
			showPopup: true,
			inputMsg: '',
			chatList: [],
			scrollTop: 0,
			sessionId: ''
		};
	},
	onLoad() {
		// 生成唯一sessionId
		this.generateSessionId();
		// 【关键】非TabBar页面，绝对不调用uni.hideTabBar()！！！
	},
	methods: {
		// 生成动态sessionId
		generateSessionId() {
			this.sessionId = `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
		},

		// 发送消息
		sendMsg() {
			const msg = this.inputMsg.trim();
			if (!msg) return uni.showToast({ title: '请输入内容', icon: 'none' });

			// 添加用户消息到聊天记录
			this.chatList.push({ role: 'user', content: msg });
			this.inputMsg = '';
			// 调用AI接口
			this.callAIApi(msg);
			// 滚动到底部
			this.scrollToBottom();
		},

		// 调用AI对话接口
		async callAIApi(message) {
			uni.showLoading({ title: '回复中...' });
			try {
				const res = await uni.request({
					url: 'https://47.95.210.123:8080/user/user/chat',
					method: 'POST',
					data: {
						message: message,
						sessionId: this.sessionId
					},
					header: { 'Content-Type': 'application/json' },
					timeout: 20000
				});
				// 处理AI回复（根据接口实际返回字段调整）
				const reply = res.data?.content || res.data?.message || '已收到你的问题，正在处理~';
				this.chatList.push({ role: 'ai', content: reply });
			} catch (err) {
				console.error('接口调用失败：', err);
				this.chatList.push({ role: 'ai', content: '网络异常，请稍后重试' });
			} finally {
				uni.hideLoading();
				this.scrollToBottom();
			}
		},

		// 滚动到聊天底部
		scrollToBottom() {
			setTimeout(() => {
				this.scrollTop = 99999;
			}, 100);
		},

		// 关闭页面（适配非TabBar页面返回）
		closePage() {
			uni.navigateBack({
				delta: 1,
				fail: () => {
					// 若返回失败（页面栈为空），跳转到首页
					uni.redirectTo({ url: '/pages/index/index' });
				}
			});
		}
	}
};
</script>

<style scoped>
/* 页面容器 */
.page-container {
	width: 100%;
	height: 100vh;
	background-color: #f8f0e3;
	font-family: 'SimSun', serif;
}

/* 顶部标题栏 */
.title-bar {
	height: 80rpx;
	background-color: #8b2323;
	color: #fff;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 20rpx;
	font-size: 32rpx;
}
.close-btn {
	background: transparent;
	color: #fff;
	font-size: 36rpx;
	padding: 0;
	border: none;
}

/* 初始弹窗 */
.popup {
	margin: 30rpx auto;
	width: 90%;
	border: 2rpx solid #8b2323;
	background-color: #fff;
	padding: 20rpx;
	border-radius: 8rpx;
}
.popup-desc {
	font-size: 28rpx;
	color: #333;
	line-height: 1.6;
}

/* 聊天内容区域 */
.chat-content {
	padding: 20rpx;
	height: calc(100vh - 200rpx);
}

/* 消息项 */
.msg-item {
	margin-bottom: 30rpx;
	max-width: 85%;
}
.user-item {
	margin-left: auto;
}
.ai-item {
	margin-right: auto;
}

/* 消息气泡 */
.msg-bubble {
	padding: 20rpx 25rpx;
	border-radius: 8rpx;
	font-size: 28rpx;
	line-height: 1.6;
}
.user-bubble {
	background-color: #e6f7ff;
	border: 2rpx solid #b8d8e8;
}
.ai-bubble {
	background-color: #fff;
	border: 2rpx solid #8b2323;
}

/* 底部输入区域 */
.input-area {
	display: flex;
	padding: 20rpx;
	gap: 15rpx;
	align-items: center;
	background-color: #f8f0e3;
}
.msg-input {
	flex: 1;
	height: 70rpx;
	padding: 0 20rpx;
	border: 2rpx solid #8b2323;
	border-radius: 8rpx;
	background-color: #fff;
	font-size: 28rpx;
}
.send-btn {
	height: 70rpx;
	padding: 0 30rpx;
	background-color: #8b2323;
	color: #fff;
	border-radius: 8rpx;
	font-size: 28rpx;
	border: none;
}
</style>
