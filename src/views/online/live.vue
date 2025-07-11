<template>
    <div class="agora-container">
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <h3>在线课堂</h3>
                </div>
            </template>


            <!-- 频道配置 -->
            <div class="config-section" v-if="!isJoined">
                <div class="input-group">
                    <label for="channelName">教室号:</label>
                    <input id="channelName" v-model="channelName" placeholder="输入教室号" />
                </div>
                <div class="input-group">
                    <label for="userRole">用户角色:</label>
                    <select id="userRole" v-model="userRole">
                        <option value="host">教师</option>
                        <option value="audience">学生</option>
                    </select>
                </div>
                <button @click="joinChannel" class="join-btn">进入教室</button>
            </div>

            <!-- 视频区域 -->
            <div class="video-section" v-show="isJoined">
                <div class="video-container">
                    <h3>{{ userRole === 'host' ? '教师' : '学生' }}</h3>
                    <div ref="localPlayer" class="video-player"></div>
                    <div class="video-info">
                        <p>用户ID: {{ localUid }}</p>
                        <p>状态: {{ isPublished ? '已发布' : '未发布' }}</p>
                        <p>当前模式: {{ isScreenSharing ? '屏幕共享' : isCameraOn ? '摄像头' : '未开启视频' }}</p>
                    </div>
                </div>

                <div class="video-container">
                    <h3>学生 ({{ remoteUsers.length }})</h3>
                    <div class="remote-users">
                        <div v-for="user in remoteUsers" :key="user.uid" class="remote-user">
                            <div :ref="el => { remotePlayerRefs.value[user.uid] = el }" class="video-player"></div>
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
                <button @click="toggleScreenShare" :class="{ active: isScreenSharing }">
                    {{ isScreenSharing ? '停止共享' : '共享屏幕' }}
                </button>
                <button @click="toggleRecording" :class="{ active: isRecording }">
                    {{ isRecording ? '停止录制' : '开始录制' }}
                </button>
                <button @click="leaveChannel" class="leave-btn">离开频道</button>
            </div>

            <!-- 状态信息 -->
            <div class="status-section">
                <p>连接状态: {{ connectionState }}</p>
                <p v-if="networkQuality">网络质量: {{ networkQuality }}</p>
                <p v-if="recordingStatus">录制状态: {{ recordingStatus }}</p>
            </div>
        </el-card>
    </div>
</template>

<script>
import { ref, onUnmounted, nextTick, onMounted } from 'vue';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { getAgoraToken } from '@/api/online';

export default {
    name: 'AgoraRTCComponent',
    setup() {
        // 声网配置 - 替换为你的App ID
        const appId = '6e333687f21748c9abda9127b2fc47b9';

        // 状态变量
        const channelName = ref('classroom1');
        const tempToken = ref('007eJxTYEhb4Nzyx1N+K1voSkfPoNe2t7xn/b5ulcKfLiZzyL7k2S8FBrNUY2NjMwvzNCNDcxOLZMvEpJRES0Mj8ySjtGQT8yTLheIFGQ2BjAwvXE0ZGRkgEMTnYkjOSSwuLsrPzzVkYAAAw8Agow=='); // 从控制台获取的临时Token
        const userRole = ref('host');
        const userId = ref(123);
        const isJoined = ref(false);
        const isPublished = ref(false);
        const isMuted = ref(false);//未静音
        const isCameraOn = ref(false);//摄像头关闭
        const localUid = ref(null);
        const remoteUsers = ref([]);
        const connectionState = ref('未连接');
        const networkQuality = ref('');
        const isScreenSharing = ref(false);
        const isRecording = ref(false);
        const recordingStatus = ref('');
        const mediaRecorder = ref(null);
        const recordedChunks = ref([]);

        // 获取Agora Token
        const fetchAgoraToken = async () => {
            try {
                const response = await getAgoraToken(channelName.value, userId.value, userRole.value);
                tempToken.value = response.token;
                console.log('获取Agora Token成功:', appId);
                console.log('获取Agora Token成功:', tempToken.value);
            } catch (error) {
                console.error('获取Agora Token失败:', error);
                alert('获取Agora Token失败，请检查控制台');
            }
        };

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
                    const playerElement = remotePlayerRefs.value[user.uid];
                    if (playerElement) {
                        user.videoTrack.play(playerElement);
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

                // 先获取token
                //await fetchAgoraToken();
                // 确保token已获取
                if (!tempToken.value) {
                    throw new Error('未能获取有效的Token');
                }

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
                    await publishLocalTracks(false);
                }

                isJoined.value = true;
            } catch (error) {
                console.error('加入频道失败:', error);
                alert(`加入频道失败: ${error.message}`);
            }
        };

        // 发布本地音视频轨道
        const publishLocalTracks = async (publishVideo = false) => {
            try {
                // 总是发布音频
                rtcClient.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

                const tracksToPublish = [rtcClient.localAudioTrack];

                // 根据参数决定是否发布视频
                if (publishVideo) {
                    rtcClient.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                        encoderConfig: '720p'
                    });
                    tracksToPublish.push(rtcClient.localVideoTrack);

                    await nextTick();
                    if (localPlayer.value) {
                        rtcClient.localVideoTrack.play(localPlayer.value);
                    }
                }

                await rtcClient.client.publish(tracksToPublish);
                isPublished.value = true;
            } catch (error) {
                console.error('发布本地轨道失败:', error);
            }
        };

        // 修改toggleCamera方法，确保在开启摄像头时发布视频轨道
        const toggleCamera = async () => {
            try {
                if (isCameraOn.value) {
                    // 关闭摄像头
                    if (rtcClient.localVideoTrack) {
                        await rtcClient.client.unpublish(rtcClient.localVideoTrack);
                        rtcClient.localVideoTrack.stop();
                        rtcClient.localVideoTrack.close();
                        rtcClient.localVideoTrack = null;
                    }
                } else {
                    // 开启摄像头
                    await publishLocalTracks(true); // 发布视频轨道
                }
                isCameraOn.value = !isCameraOn.value;
            } catch (error) {
                console.error('切换摄像头失败:', error);
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

        // 切换屏幕共享状态
        const toggleScreenShare = async () => {
            try {
                if (isScreenSharing.value) {
                    // 停止屏幕共享
                    await stopScreenShare();
                    isScreenSharing.value = false;

                    // 恢复之前的摄像头状态
                    if (rtcClient._previousCameraState?.wasCameraOn) {
                        await restoreCamera();
                    }
                } else {
                    // 开始屏幕共享
                    await startScreenShare();
                    isScreenSharing.value = true;
                }
            } catch (error) {
                console.error('屏幕共享操作失败:', error);
                recordingStatus.value = `屏幕共享失败: ${error.message}`;
                isScreenSharing.value = false;

                // 失败时尝试恢复摄像头
                if (rtcClient._previousCameraState?.wasCameraOn) {
                    await restoreCamera();
                }
            }
        };

        // 停止屏幕共享的独立函数
        const stopScreenShare = async () => {
            if (!rtcClient.localVideoTrack) return;

            try {
                // 检查是否是屏幕共享轨道
                const track = rtcClient.localVideoTrack.getMediaStreamTrack();
                if (track) {
                    // 移除结束监听器
                    track.onended = null;

                    // 停止轨道
                    track.stop();
                }

                // 关闭并移除本地视频轨道
                rtcClient.localVideoTrack.close();
                rtcClient.localVideoTrack = null;

                // 取消发布视频轨道
                await rtcClient.client.unpublish(rtcClient.localVideoTrack);
            } catch (error) {
                console.error('停止屏幕共享时出错:', error);
                throw error;
            }
        };

        // 开始屏幕共享的独立函数
        const startScreenShare = async () => {
            try {
                // 保存当前摄像头状态
                rtcClient._previousCameraState = {
                    wasCameraOn: isCameraOn.value,
                    wasVideoPublished: isPublished.value
                };

                // 关闭当前视频轨道（如果有）
                if (rtcClient.localVideoTrack) {
                    await rtcClient.client.unpublish(rtcClient.localVideoTrack);
                    rtcClient.localVideoTrack.close();
                    rtcClient.localVideoTrack = null;
                }

                // 创建屏幕共享轨道
                let screenTrack;
                try {
                    screenTrack = await AgoraRTC.createScreenVideoTrack({
                        encoderConfig: '1080p_1',
                        screenShareConfig: {
                            contentHint: 'detail',
                            captureMouseCursor: true
                        }
                    }, "auto");
                } catch (error) {
                    // 处理用户取消共享选择的情况
                    if (error.message.includes('Permission denied') ||
                        error.message.includes('User canceled')) {
                        throw new Error('用户取消了屏幕共享');
                    }
                    throw error;
                }

                // 处理返回的轨道（可能是数组或单个轨道）
                rtcClient.localVideoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

                if (!rtcClient.localVideoTrack) {
                    throw new Error('无法获取屏幕共享轨道');
                }

                // 验证轨道是否有效
                const mediaStreamTrack = rtcClient.localVideoTrack.getMediaStreamTrack();
                if (!mediaStreamTrack) {
                    throw new Error('获取的屏幕共享轨道无效');
                }

                // 监听屏幕共享停止事件
                mediaStreamTrack.onended = () => {
                    console.log('屏幕共享被用户手动停止');
                    toggleScreenShare();
                };

                // 发布屏幕共享轨道
                const tracksToPublish = [];
                if (rtcClient.localAudioTrack) {
                    tracksToPublish.push(rtcClient.localAudioTrack);
                }
                tracksToPublish.push(rtcClient.localVideoTrack);

                await rtcClient.client.publish(tracksToPublish);

                // 播放屏幕共享视频
                if (localPlayer.value) {
                    rtcClient.localVideoTrack.play(localPlayer.value);
                }

                // 更新状态
                isCameraOn.value = false;
                isPublished.value = true;

                // 检查轨道是否真的可用
                await new Promise((resolve, reject) => {
                    const checkInterval = setInterval(() => {
                        if (mediaStreamTrack.readyState === 'ended') {
                            clearInterval(checkInterval);
                            reject(new Error('屏幕共享轨道意外结束'));
                        }

                        // 检查视频轨道是否有帧数据
                        const videoElement = document.createElement('video');
                        videoElement.srcObject = new MediaStream([mediaStreamTrack]);
                        videoElement.onloadedmetadata = () => {
                            clearInterval(checkInterval);
                            resolve();
                        };
                        videoElement.onerror = () => {
                            clearInterval(checkInterval);
                            reject(new Error('屏幕共享轨道无法播放'));
                        };

                        // 超时检查
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            reject(new Error('屏幕共享轨道验证超时'));
                        }, 3000);
                    }, 300);
                });

            } catch (error) {
                console.error('开始屏幕共享时出错:', error);
                throw error;
            }
        };

        // 恢复摄像头的独立函数
        const restoreCamera = async () => {
            try {
                if (rtcClient.localVideoTrack) {
                    await rtcClient.client.unpublish(rtcClient.localVideoTrack);
                    rtcClient.localVideoTrack.close();
                    rtcClient.localVideoTrack = null;
                }

                rtcClient.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                    encoderConfig: '720p'
                });

                const tracksToPublish = [];
                if (rtcClient.localAudioTrack) {
                    tracksToPublish.push(rtcClient.localAudioTrack);
                }
                tracksToPublish.push(rtcClient.localVideoTrack);

                await rtcClient.client.publish(tracksToPublish);
                rtcClient.localVideoTrack.play(localPlayer.value);

                isCameraOn.value = true;
                isPublished.value = true;
            } catch (error) {
                console.error('恢复摄像头时出错:', error);
                isCameraOn.value = false;
                isPublished.value = false;
                throw error;
            }
        };

        // 本地录制
        const toggleRecording = async () => {
            try {
                if (isRecording.value) {
                    // 停止录制
                    mediaRecorder.value.stop();
                    isRecording.value = false;
                    recordingStatus.value = '录制已停止，正在生成文件...';
                } else {
                    // 开始录制
                    recordedChunks.value = [];
                    const stream = new MediaStream();

                    // 添加音频轨道
                    if (rtcClient.localAudioTrack) {
                        stream.addTrack(rtcClient.localAudioTrack.getMediaStreamTrack());
                    }

                    // 添加视频轨道（屏幕共享或摄像头）
                    if (rtcClient.localVideoTrack) {
                        stream.addTrack(rtcClient.localVideoTrack.getMediaStreamTrack());
                    }

                    // 如果没有音视频轨道则不能录制
                    if (stream.getTracks().length === 0) {
                        recordingStatus.value = '无法录制：没有可用的音视频轨道';
                        return;
                    }

                    mediaRecorder.value = new MediaRecorder(stream, {
                        mimeType: 'video/webm;codecs=vp9'
                    });

                    mediaRecorder.value.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            recordedChunks.value.push(event.data);
                        }
                    };

                    mediaRecorder.value.onstop = () => {
                        const blob = new Blob(recordedChunks.value, {
                            type: 'video/webm'
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = `录制-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        }, 100);

                        recordingStatus.value = '录制文件已下载';
                    };

                    mediaRecorder.value.start(1000); // 每1秒收集一次数据
                    isRecording.value = true;
                    recordingStatus.value = '正在录制...';
                }
            } catch (error) {
                console.error('录制操作失败:', error);
                recordingStatus.value = `录制失败: ${error.message}`;
                isRecording.value = false;
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

                if (isRecording.value) {
                    mediaRecorder.value.stop();
                    isRecording.value = false;
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
            isScreenSharing,
            isRecording,
            recordingStatus,

            // DOM引用
            localPlayer,

            // 方法
            joinChannel,
            leaveChannel,
            toggleMic,
            toggleCamera,
            toggleScreenShare,
            toggleRecording
        };
    }
};
</script>

<style scoped>
.agora-container {
    max-width: 1200px;
    margin: 0 auto;
}

h3 {
    margin: 0;
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

button.active.recording {
    background: #ff5722;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.7;
    }

    100% {
        opacity: 1;
    }
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