import paramiko
import os
import json
import urllib.request

VIDEOS_DIR = r'D:\Liza_DOP\assets\videos'
THUMBS_DIR = r'D:\Liza_DOP\assets\videos\thumbs'
REMOTE_DIR = 'public_html/uploads'
API_BASE   = 'https://elizabethkalinina.com'
ADMIN_PASS = 'adminpass123321'

MAPPING = [
    {
        'title_match': 'DOP showreel',
        'video_local': 'dop_showreel_elizabeth_kalinina (1080p).mp4',
        'thumb_local': 'dop_showreel_elizabeth_kalinina (1080p).png',
        'video_upload': 'dop_showreel_kalinina_1080p.mp4',
        'thumb_upload': 'thumb_dop_showreel.png',
    },
    {
        'title_match': '80 Meters',
        'video_local': '80 Meters Under Ice Documentary.mp4',
        'thumb_local': '80 Meters Under Ice Documentary.png',
        'video_upload': '80_meters_under_ice.mp4',
        'thumb_upload': 'thumb_80_meters.png',
    },
    {
        'title_match': 'Enterprise',
        'video_local': 'enterprise_intelligence___private_5g_network_from_verizon_business_v1 (1080p).mp4',
        'thumb_local': 'Enterprise Intelligence _ Private 5G Network from Verizon Business.png',
        'video_upload': 'enterprise_intelligence_5g.mp4',
        'thumb_upload': 'thumb_enterprise.png',
    },
    {
        'title_match': 'Maggi',
        'video_local': 'Maggi Nestle commercial .MP4',
        'thumb_local': 'Maggi Nestle commercial .png',
        'video_upload': 'maggi_nestle_commercial.mp4',
        'thumb_upload': 'thumb_maggi_nestle.png',
        'id_override': '70b8b5eb-6487-4812-bede-30c5409a5629',
    },
    {
        'title_match': 'maggi',
        'video_local': 'Maggi- Nestle commerical.MP4',
        'thumb_local': 'Maggi- Nestle commerical.png',
        'video_upload': 'maggi_nestle_commerical.mp4',
        'thumb_upload': 'thumb_maggi_commerical.png',
        'id_override': '027eeb45-15b4-42f8-a391-f7d71614fba1',
    },
    {
        'title_match': 'Thunder',
        'video_local': 'Thunder Saudi Arabia- commercial .mov',
        'thumb_local': 'Thunder Saudi Arabia- commercial .png',
        'video_upload': 'thunder_saudi_arabia.mov',
        'thumb_upload': 'thumb_thunder.png',
    },
    {
        'title_match': 'Directors Showreel',
        'video_local': 'directors_showreel_elizabeth_kalinin_2025 (1080p).mp4',
        'thumb_local': 'directors_showreel_elizabeth_kalinin_2025 (1080p).png',
        'video_upload': 'directors_showreel_2025.mp4',
        'thumb_upload': 'thumb_directors_showreel.png',
    },
    {
        'title_match': 'Desert Rider',
        'video_local': 'Desert Rider.mp4',
        'thumb_local': 'Desert Rider.png',
        'video_upload': 'desert_rider.mp4',
        'thumb_upload': 'thumb_desert_rider.png',
    },
    {
        'title_match': 'Cat Veterinary',
        'video_local': 'Veterinary Clinic Commercial (2160P).mp4',
        'thumb_local': 'Veterinary Clinic Commercial (2160P).png',
        'video_upload': 'veterinary_clinic_commercial.mp4',
        'thumb_upload': 'thumb_veterinary.png',
    },
    {
        'title_match': 'Commander',
        'video_local': 'commander_islands_far_east_expedition_v1 (1080p).mp4',
        'thumb_local': 'commander_islands_far_east_expedition_v1 (1080p).png',
        'video_upload': 'commander_islands_expedition.mp4',
        'thumb_upload': 'thumb_commander.png',
    },
    {
        'title_match': 'Sirotkin',
        'video_local': 'Sirotkin Music Clip.mp4',
        'thumb_local': 'Sirotkin Music Clip.png',
        'video_upload': 'sirotkin_music_clip.mp4',
        'thumb_upload': 'thumb_sirotkin.png',
    },
    {
        'title_match': 'Quarantine',
        'video_local': '\u041a\u0430\u0440\u0430\u043d\u0442\u0438\u043d\u043d\u0430\u044f \u041a\u043e\u043c\u043d\u0430\u0442\u0430.mp4',
        'thumb_local': '\u041a\u0430\u0440\u0430\u043d\u0442\u0438\u043d\u043d\u0430\u044f \u041a\u043e\u043c\u043d\u0430\u0442\u0430.png',
        'video_upload': 'quarantine_room.mp4',
        'thumb_upload': 'thumb_quarantine_room.png',
    },
    {
        'title_match': 'showreel',
        'video_local': None,
        'thumb_local': 'Private.png',
        'video_upload': None,
        'thumb_upload': 'thumb_showreel_private.png',
        'id_override': '4b13207a-bff8-45f5-a894-b8a2c8257b45',
    },
]

def main():
    # 1. Fetch projects
    print("Fetching projects from API...")
    req = urllib.request.Request(f'{API_BASE}/api/projects')
    with urllib.request.urlopen(req) as r:
        projects = json.loads(r.read())
    print(f"  Got {len(projects)} projects\n")

    # 2. Connect SFTP
    print("Connecting via SFTP...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('72.60.93.236', port=65002, username='u147312704', password='V4#i9rqnWzpD-.-')
    sftp = client.open_sftp()
    print("  Connected\n")

    def upload_file(local_path, remote_name):
        remote_path = f'{REMOTE_DIR}/{remote_name}'
        size_mb = os.path.getsize(local_path) / 1024 / 1024
        print(f"  Uploading {remote_name} ({size_mb:.1f} MB)...")
        sftp.put(local_path, remote_path)
        print(f"  done")

    # 3. Upload thumbnails
    print("=== Uploading thumbnails ===")
    for m in MAPPING:
        if m['thumb_local']:
            local = os.path.join(THUMBS_DIR, m['thumb_local'])
            if os.path.exists(local):
                upload_file(local, m['thumb_upload'])
            else:
                print(f"  SKIP (not found): {m['thumb_local']}")

    # 4. Upload videos
    print("\n=== Uploading videos ===")
    for m in MAPPING:
        if m['video_local']:
            local = os.path.join(VIDEOS_DIR, m['video_local'])
            if os.path.exists(local):
                upload_file(local, m['video_upload'])
            else:
                print(f"  SKIP (not found): {m['video_local']}")

    sftp.close()
    client.close()
    print("\nSFTP closed.\n")

    # 5. Update DB
    print("=== Updating database ===")

    def find_project(title_match, id_override=None):
        if id_override:
            for p in projects:
                if p['id'] == id_override:
                    return p
        for p in projects:
            if title_match.lower() in p['title'].lower():
                return p
        return None

    for m in MAPPING:
        p = find_project(m['title_match'], m.get('id_override'))
        if not p:
            print(f"  NOT FOUND in DB: {m['title_match']}")
            continue

        new_media = f"/uploads/{m['video_upload']}" if m['video_upload'] else p['media_url']
        new_thumb = f"/uploads/{m['thumb_upload']}" if m['thumb_upload'] else p.get('thumbnail_url', '')

        payload = {**p, 'media_url': new_media, 'thumbnail_url': new_thumb}
        data = json.dumps(payload).encode()

        req = urllib.request.Request(
            f"{API_BASE}/api/projects/{p['id']}",
            data=data,
            method='PATCH',
            headers={
                'Content-Type': 'application/json',
                'x-admin-password': ADMIN_PASS,
            }
        )
        try:
            with urllib.request.urlopen(req) as r:
                print(f"  Updated: {p['title']}")
        except Exception as e:
            print(f"  FAILED: {p['title']} -- {e}")

    print("\nAll done!")

if __name__ == '__main__':
    main()
