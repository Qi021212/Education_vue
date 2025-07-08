<template>
    <div class="agora-container">
        <h1>声网RTC测试</h1>

        <!-- 频道配置 -->
        <div class="config-section" v-if="!isJoined">
            <div class="input-group">
                <label for="channelName">频道名称:</label>
                <input id="channelName" v-model="channelName" placeholder="输入频道名称" />
            </div>
            <div class="input-group">
                <label for="tempToken">临时Token:</label>
                <input id="tempToken" v-model="tempToken" placeholder="输入临时Token" />
            </div>
            <div class="input-group">
                <label for="userRole">用户角色:</label>
                <select id="userRole" v-model="userRole">
                    <option value="host">主播</option>
                    <option value="audience">观众</option>
                </select>
            </div>
            <button @click="joinChannel" class="join-btn">加入频道</button>
        </div>

        <!-- 视频区域 -->
        <div class="video-section" v-show="isJoined">
            <div class="video-container">
                <h3>本地视频</h3>
                <div ref="localPlayer" class="video-player"></div>
                <div class="video-info">
                    <p>用户ID: {{ localUid }}</p>
                    <p>状态: {{ isPublished ? '已发布' : '未发布' }}</p>
                </div>
            </div>

            <div class="video-container">
                <h3>远程用户 ({{ remoteUsers.length }})</h3>
                <div class="remote-users">
                    <div v-for="user in remoteUsers" :key="user.uid" class="remote-user">
                        <div :ref="`remotePlayer_${user.uid}`" class="video-player"></div>
                        <div class="user-info">用户ID: {{ user.uid }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 控制按钮 -->
        <div class="control-section" v-if="isJoined">
            <button @click="toggleMic" :class="{ active: !isMuted }">
                {{ isMuted ? '开启麦克风' : '关闭麦克风' }}
            </button>
            <button @click="toggleCamera" :class="{ active: isCameraOn }">
                {{ isCameraOn ? '关闭摄像头' : '开启摄像头' }}
            </button>
            <button @click="leaveChannel" class="leave-btn">离开频道</button>
        </div>

        <!-- 状态信息 -->
        <div class="status-section">
            <p>连接状态: {{ connectionState }}</p>
            <p v-if="networkQuality">网络质量: {{ networkQuality }}</p>
        </div>
    </div>
</template>

<script>
import { ref, onUnmounted, nextTick, onMounted } from 'vue';
import AgoraRTC from 'agora-rtc-sdk-ng';

export default {
    name: 'AgoraRTCComponent',
    setup() {
        // 声网配置 - 替换为你的App ID
        const appId = '6e333687f21748c9abda9127b2fc47b9';

        // 状态变量
        const channelName = ref('test_channel');
        const tempToken = ref(''); // 从控制台获取的临时Token
        const userRole = ref('host');
        const isJoined = ref(false);
        const isPublished = ref(false);
        const isMuted = ref(false);//未静音
        const isCameraOn = ref(true);//摄像头开启
        const localUid = ref(null);
        const remoteUsers = ref([]);
        const connectionState = ref('未连接');
        const networkQuality = ref('');

        // DOM引用
        const localPlayer = ref(null);

        // 声网客户端和轨道
        const rtcClient = {
            client: null,
            localAudioTrack: null,
            localVideoTrack: null
        };

        // 初始化声网客户端
        const initRTCClient = () => {
            rtcClient.client = AgoraRTC.createClient({
                mode: "live",
                codec: "vp8"
            });

            // 设置事件监听
            rtcClient.client.on('connection-state-change', (state) => {
                connectionState.value = state;
            });

            rtcClient.client.on('network-quality', (stats) => {
                networkQuality.value = `上行: ${stats.uplinkNetworkQuality}, 下行: ${stats.downlinkNetworkQuality}`;
            });

            rtcClient.client.on('user-published', async (user, mediaType) => {
                await rtcClient.client.subscribe(user, mediaType);

                if (!remoteUsers.value.some(u => u.uid === user.uid)) {
                    remoteUsers.value.push(user);
                }

                await nextTick();

                if (mediaType === 'video') {
                    const playerRef = `remotePlayer_${user.uid}`;
                    if (playerRef in refs) {
                        user.videoTrack.play(refs[playerRef][0]);
                    }
                }

                if (mediaType === 'audio') {
                    user.audioTrack.play();
                }
            });

            rtcClient.client.on('user-unpublished', (user) => {
                remoteUsers.value = remoteUsers.value.filter(u => u.uid !== user.uid);
            });
        };

        // 加入频道
        const joinChannel = async () => {
            if (!channelName.value) {
                alert('请输入频道名称');
                return;
            }

            try {
                // 初始化客户端
                if (!rtcClient.client) initRTCClient();

                // 设置客户端角色
                await rtcClient.client.setClientRole(userRole.value);

                // 加入频道 - 使用临时Token
                localUid.value = await rtcClient.client.join(
                    appId,
                    channelName.value,
                    tempToken.value || null,
                    null // 让声网自动分配UID
                );

                console.log(`加入频道成功，UID: ${localUid.value}`);

                // 如果是主播，发布本地流
                if (userRole.value === 'host') {
                    await publishLocalTracks();
                }

                isJoined.value = true;
            } catch (error) {
                console.error('加入频道失败:', error);
                alert(`加入频道失败: ${error.message}`);
            }
        };

        // 发布本地音视频轨道
        const publishLocalTracks = async () => {
            try {
                rtcClient.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                rtcClient.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                    encoderConfig: '720p'
                });

                await rtcClient.client.publish([
                    rtcClient.localAudioTrack,
                    rtcClient.localVideoTrack
                ]);

                await nextTick();
                // 确保localPlayer ref已绑定
                if (localPlayer.value) {
                    rtcClient.localVideoTrack.play(localPlayer.value);
                } else {
                    console.error('localPlayer ref not found');
                }

                isPublished.value = true;
            } catch (error) {
                console.error('发布本地轨道失败:', error);
            }
        };

        // 切换麦克风状态
        const toggleMic = async () => {
            if (!rtcClient.localAudioTrack) return;

            try {
                await rtcClient.localAudioTrack.setMuted(!isMuted.value);
                isMuted.value = !isMuted.value;
            } catch (error) {
                console.error('切换麦克风失败:', error);
            }
        };

        // 切换摄像头状态
        const toggleCamera = async () => {
            if (!rtcClient.localVideoTrack) return;

            try {
                await rtcClient.localVideoTrack.setMuted(isCameraOn.value);
                isCameraOn.value = !isCameraOn.value;
            } catch (error) {
                console.error('切换摄像头失败:', error);
            }
        };

        // 离开频道
        const leaveChannel = async () => {
            try {
                // 停止并关闭本地轨道
                if (rtcClient.localAudioTrack) {
                    rtcClient.localAudioTrack.stop();
                    rtcClient.localAudioTrack.close();
                }
                if (rtcClient.localVideoTrack) {
                    rtcClient.localVideoTrack.stop();
                    rtcClient.localVideoTrack.close();
                }

                // 离开频道
                await rtcClient.client.leave();

                // 重置状态
                isJoined.value = false;
                isPublished.value = false;
                remoteUsers.value = [];
                localUid.value = null;

                console.log('已离开频道');
            } catch (error) {
                console.error('离开频道失败:', error);
            }
        };

        // 组件卸载时清理
        onUnmounted(async () => {
            if (isJoined.value) {
                await leaveChannel();
            }
        });

        return {
            // 状态
            channelName,
            tempToken,
            userRole,
            isJoined,
            isPublished,
            isMuted,
            isCameraOn,
            localUid,
            remoteUsers,
            connectionState,
            networkQuality,

            // DOM引用
            localPlayer,

            // 方法
            joinChannel,
            leaveChannel,
            toggleMic,
            toggleCamera
        };
    }
};
</script>

<style scoped>
.agora-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.config-section,
.video-section,
.control-section,
.status-section {
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
}

.input-group {
    margin-bottom: 10px;
}

.input-group label {
    display: inline-block;
    width: 100px;
}

input,
select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 300px;
}

button {
    padding: 10px 15px;
    margin-right: 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.join-btn {
    background: #4CAF50;
    color: white;
}

.leave-btn {
    background: #f44336;
    color: white;
}

button.active {
    background: #2196F3;
    color: white;
}

.video-section {
    display: flex;
    gap: 20px;
}

.video-container {
    flex: 1;
}

.video-player {
    width: 100%;
    height: 300px;
    background: #333;
    margin-bottom: 10px;
}

.remote-users {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 10px;
}

.remote-user {
    position: relative;
}

.user-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 5px;
    font-size: 12px;
}

.video-info {
    font-size: 14px;
    color: #666;
}

@media (max-width: 768px) {
    .video-section {
        flex-direction: column;
    }

    input,
    select {
        width: 100%;
    }
}
</style>