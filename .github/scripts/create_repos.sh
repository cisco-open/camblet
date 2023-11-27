#!/bin/bash
generate_hashes() {
  HASH_TYPE="$1"
  HASH_COMMAND="$2"
  echo "${HASH_TYPE}:"
  find "main" -type f | while read -r file
  do
    echo " $(${HASH_COMMAND} "$file" | cut -d" " -f1) $(wc -c "$file")"
  done
}

main() {
  GOT_DEB=0
  GOT_RPM=0
  DEB_POOL="_site/deb/pool/main"
  DEB_DISTS_COMPONENTS="dists/stable/main/binary-all"

  REPOS_PATH=".github/config/gh_projects.txt"
  vim $REPOS_PATH -c "set ff=unix" -c ":wq"

  #Check if the file exists
  if [ ! -f "$REPOS_PATH" ]
  then
    echo "File not found: ${REPOS_PATH}"
    exit 1
  fi

  while IFS= read -r repo;
  do
    if release=$(curl -fqs https://api.github.com/repos/${repo}/releases/tags/${GITHUB_REF_NAME})
    then
      tag="$GITHUB_REF_NAME"
      deb_file="$(echo "$release" | jq -r '.assets[] | select(.name | endswith(".deb")) | .name')"
      rpm_file="$(echo "$release" | jq -r '.assets[] | select(.name | endswith(".rpm")) | .name')"
      package_name="${repo##*/}"
      echo "Parsing repo ${repo} at $tag"
      if [ -n "$deb_file" ]
      then
        GOT_DEB=1
        mkdir -p "${DEB_POOL}/${package_name}"
        pushd "${DEB_POOL}/${package_name}" >/dev/null
        echo "Getting DEB"
        wget -q "https://github.com/${repo}/releases/download/${tag}/${deb_file}"
        popd >/dev/null
      fi
      if [ -n "$rpm_file" ]
      then
        GOT_RPM=1
        mkdir -p _site/rpm
        pushd _site/rpm >/dev/null
        echo "Getting RPM"
        wget -q "https://github.com/${repo}/releases/download/${tag}/${rpm_file}"
        (
          if [ -n "$GPG_FINGERPRINT" ]
          then
            echo "Signing RPM"
            rpm --define "%_signature gpg" --define "%_gpg_name ${GPG_FINGERPRINT}" --addsign "${rpm_file}"
          fi
        )
        popd >/dev/null
      fi
    fi
  done < "$REPOS_PATH"

  if [ $GOT_DEB -eq 1 ]
  then
    pushd _site/deb >/dev/null
    mkdir -p "${DEB_DISTS_COMPONENTS}"
    echo "Scanning all downloaded DEB Packages and creating Packages file."
    dpkg-scanpackages --arch all pool/ > "${DEB_DISTS_COMPONENTS}/Packages"
    gzip -9 > "${DEB_DISTS_COMPONENTS}/Packages.gz" < "${DEB_DISTS_COMPONENTS}/Packages"
    bzip2 -9 > "${DEB_DISTS_COMPONENTS}/Packages.bz2" < "${DEB_DISTS_COMPONENTS}/Packages"
    popd >/dev/null
    pushd "_site/deb/dists/stable/" >/dev/null
    echo "Making Release file"
    {
      echo "Origin: ${ORIGIN}"
      echo "Label: ${REPO_OWNER}"
      echo "Suite: stable"
      echo "Codename: stable"
      echo "Version: 1.0"
      echo "Architectures: all"
      echo "Components: main"
      echo "Description: A repository for packages released by ${REPO_OWNER}}"
      echo "Date: $(date -Ru)"
      generate_hashes MD5Sum md5sum
      generate_hashes SHA1 sha1sum
      generate_hashes SHA256 sha256sum
    } > Release
    echo "Signing Release file"
    gpg --detach-sign --armor --sign > Release.gpg < Release
    gpg --detach-sign --armor --sign --clearsign > InRelease < Release
    echo "DEB repo built"
    popd >/dev/null
  fi

  if [ $GOT_RPM -eq 1 ]
  then
    pushd _site/rpm >/dev/null
    echo "Scanning RPM packages and creating the Repo"
    createrepo_c .
    echo "Signing the Repo Metadata"
    gpg --detach-sign --armor repodata/repomd.xml
    echo "RPM repo built"
    popd >/dev/null
  fi
}
main