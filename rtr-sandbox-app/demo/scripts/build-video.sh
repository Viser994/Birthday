#!/usr/bin/env bash
set -euo pipefail

FRAMES=/tmp/rtr-demo/frames
CLIPS=/tmp/rtr-demo/clips
OUT_DIR=/opt/cursor/artifacts/rtr-demo
FONT_BOLD=/usr/share/fonts/truetype/macos/Inter-Bold.ttf
FONT_REG=/usr/share/fonts/truetype/macos/Inter-Regular.ttf
W=1440
H=900

mkdir -p "$CLIPS" "$OUT_DIR"
rm -f "$CLIPS"/*.mp4 "$CLIPS"/list.txt

make_title() {
  local file="$1"
  local title="$2"
  local subtitle="$3"
  local secs="$4"
  ffmpeg -y -f lavfi -i "color=c=0x0F4F3C:s=${W}x${H}:d=${secs}" \
    -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
    -vf "drawtext=fontfile=${FONT_BOLD}:text='${title}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-40,\
drawtext=fontfile=${FONT_REG}:text='${subtitle}':fontcolor=0xD7E7DF:fontsize=30:x=(w-text_w)/2:y=(h-text_h)/2+50" \
    -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -r 30 "$file" </dev/null
}

make_slide() {
  local img="$1"
  local out="$2"
  local caption="$3"
  local secs="$4"
  # Lower-third caption bar
  ffmpeg -y -loop 1 -i "$img" -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" -t "$secs" \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x10231F,\
drawbox=x=0:y=h-110:w=iw:h=110:color=0x0F4F3C@0.92:t=fill,\
drawtext=fontfile=${FONT_REG}:text='${caption}':fontcolor=white:fontsize=28:x=36:y=h-70" \
    -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -r 30 "$out" </dev/null
}

echo "Building title cards..."
make_title "$CLIPS/00-title.mp4" "RTR Rail Lab" "Payments Canada Real-Time Rail sandbox demo" 3.5
make_title "$CLIPS/00b-agenda.mp4" "Client walkthrough" "Connect  ·  Guided flow  ·  Readable results  ·  Reports" 3.2

echo "Building scene clips..."
make_slide "$FRAMES/01-home.png" "$CLIPS/01.mp4" "Live sandbox workspace for Real-Time Rail APIs" 3.2
make_slide "$FRAMES/02-credentials.png" "$CLIPS/02.mp4" "Securely connect with Developer Portal Consumer Key and Secret" 3.4
make_slide "$FRAMES/03-guided-tour.png" "$CLIPS/03.mp4" "Guided happy path: token → heartbeat → payment → status" 3.4
make_slide "$FRAMES/04-tour-running.png" "$CLIPS/04.mp4" "One click runs the end-to-end sandbox journey" 3.0
make_slide "$FRAMES/05-tour-complete.png" "$CLIPS/05.mp4" "Tour completes against live Payments Canada sandbox" 3.2
make_slide "$FRAMES/06-readable-results.png" "$CLIPS/06.mp4" "ISO 20022 responses decoded into plain language" 3.6
make_slide "$FRAMES/07-send-payment-form.png" "$CLIPS/07.mp4" "Send pacs.008 credit transfers with editable business fields" 3.4
make_slide "$FRAMES/08-payment-accepted.png" "$CLIPS/08.mp4" "Payment accepted for settlement — ACSP status explained clearly" 3.8
make_slide "$FRAMES/09-activity-panel.png" "$CLIPS/09.mp4" "Session memory keeps the latest payment UETR and run history" 3.6
make_slide "$FRAMES/10-status-prefilled.png" "$CLIPS/10.mp4" "One-click status enquiry pre-filled from the last payment" 3.5
make_slide "$FRAMES/11-status-result.png" "$CLIPS/11.mp4" "Status enquiry returns a readable pacs.002 confirmation" 3.5
make_slide "$FRAMES/12-interest-report.png" "$CLIPS/12.mp4" "Clearing and Settlement interest report with balance lines" 3.6
make_slide "$FRAMES/13-glossary.png" "$CLIPS/13.mp4" "Built-in glossary for ACSP, UETR, heartbeat, and reject codes" 3.5
make_slide "$FRAMES/14-closing.png" "$CLIPS/14.mp4" "Ready for client demos, training, and sandbox onboarding" 3.2

make_title "$CLIPS/99-end.mp4" "Thank you" "RTR Rail Lab  ·  Payments Canada sandbox explorer" 3.5

echo "Concatenating..."
cat > "$CLIPS/list.txt" <<EOF
file '00-title.mp4'
file '00b-agenda.mp4'
file '01.mp4'
file '02.mp4'
file '03.mp4'
file '04.mp4'
file '05.mp4'
file '06.mp4'
file '07.mp4'
file '08.mp4'
file '09.mp4'
file '10.mp4'
file '11.mp4'
file '12.mp4'
file '13.mp4'
file '14.mp4'
file '99-end.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$CLIPS/list.txt" -c:v libx264 -pix_fmt yuv420p -c:a aac \
  "$OUT_DIR/rtr-rail-lab-client-demo.mp4" </dev/null

# Also copy a poster/thumbnail from a strong mid-demo frame
cp "$FRAMES/08-payment-accepted.png" "$OUT_DIR/rtr-rail-lab-demo-poster.png"
cp "$FRAMES/01-home.png" "$OUT_DIR/rtr-rail-lab-home.png"
cp "$FRAMES/06-readable-results.png" "$OUT_DIR/rtr-rail-lab-readable-results.png"

# Lightweight web-friendly copy
ffmpeg -y -i "$OUT_DIR/rtr-rail-lab-client-demo.mp4" -vf "scale=1280:-2" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k \
  "$OUT_DIR/rtr-rail-lab-client-demo-1280.mp4" </dev/null

ls -lh "$OUT_DIR"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT_DIR/rtr-rail-lab-client-demo.mp4"
echo "DONE"
