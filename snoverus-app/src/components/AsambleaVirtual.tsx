"use client";
import { JitsiMeeting } from '@jitsi/react-sdk';

export default function AsambleaVirtual({ salaId }: { salaId: string }) {
    return (
        <div className="w-full h-[600px] rounded-lg overflow-hidden border border-slate-200 shadow-md">
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={salaId}
                configOverwrite={{
                    startWithAudioMuted: true,
                    startWithVideoMuted: true,
                    prejoinPageEnabled: false,
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                }}
            />
        </div>
    );
}