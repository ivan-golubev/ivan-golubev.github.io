import os
import subprocess
from pathlib import Path


def www_root_dir() -> Path:
    return Path(__file__).parent.parent.resolve()


def get_markdown_filenames() -> list[str]:
    return [
        os.path.join(root, filename)
        for root, dirs, files in os.walk(www_root_dir())
        for filename in files
        if filename.endswith(".md")
    ]


def get_pandoc_location() -> str:
    # for Linux - a different pandoc location is needed
    assert os.name == "nt", "This program requires Windows OS"
    pandoc_path = os.path.expandvars("%LOCALAPPDATA%\\Pandoc\\pandoc.exe")
    if not os.path.exists(pandoc_path):
        raise FileNotFoundError(
            "pandoc not installed or cannot be found. Install it from https://pandoc.org"
        )
    return pandoc_path


# returns true if operation was successful
def generate_html(markdown_filename: str) -> bool:
    html_filename = os.path.splitext(markdown_filename)[0] + ".html"
    header_file = os.path.join(www_root_dir(), "html", "header.html")
    beforebody_file = os.path.join(www_root_dir(), "html", "before-body.html")
    afterbody_file = os.path.join(www_root_dir(), "html", "after-body.html")
    # note that at the moment the template file is a carbon copy of the default, so this is only for visibility
    html_template_file = os.path.join(www_root_dir(), "templates", "default.html")
    metadata_file = os.path.join(www_root_dir(), "templates", "metadata.yaml")
    style = "breezedark"
    command = f"{get_pandoc_location()} -s -o {html_filename} \
-f markdown {markdown_filename} \
-t html --highlight-style {style} \
-H {header_file} -B {beforebody_file} -A {afterbody_file} \
--template={html_template_file} \
--metadata-file={metadata_file}"
    print(command)
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode == 0:
        print("[success]\n")
    else:
        print("[failed]")
        print("Return code:", result.returncode)
        print(result.stdout)
        print(result.stderr)
    return result.returncode == 0


def main():
    for f in get_markdown_filenames():
        status = generate_html(f)
        if not status:
            break


if __name__ == "__main__":
    main()
