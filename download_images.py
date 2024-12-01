import os
import requests
import json

stats = {
    'already_exists': 0,
    'success': 0,
    'fail': 0
}

def download_image(url: str, filename: str) -> None:
    response = requests.get(url)

    if response.status_code != 200:
        print('Failed to download:', url)
        stats['fail'] += 1
        return

    if not os.path.exists(filename):
        os.makedirs(os.path.dirname(filename), exist_ok=True)

    print('Downloaded:', filename)
    stats['success'] += 1
    with open(filename, "wb") as f:
        f.write(response.content)

with open("image_links.json", "r") as f:
    image_links = json.load(f)

for village in image_links:
    for main_type in image_links[village]:
        for name in image_links[village][main_type]:
            for level in image_links[village][main_type][name]:

                # Skips source attribution links.
                if level[0] == '#':
                    continue

                image_type = image_links[village][main_type][name][level].rsplit('/', 1)[1].split('.')[1]

                file_name = f"site/static/images/{village}/{main_type}/{name}/{level}.{image_type}"

                if os.path.exists(file_name):
                    print('Already exists:', file_name)
                    stats['already_exists'] += 1
                    continue

                download_image(image_links[village][main_type][name][level], file_name)

print('Download statistics:',stats)
print('Done.')