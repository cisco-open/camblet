#!/bin/bash
set +x;

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
  DEB_POOL="generated_repo/deb/pool/main"
  DEB_DISTS_COMPONENTS="dists/stable/main/binary"

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
    package_name="${repo##*/}"
    if release_ids=$(curl -fqs https://api.github.com/repos/${repo}/releases?per_page=100 | jq -r '.[].id')
    then
      for release_id in $release_ids;
      do
        echo "Processing release ID: $release_id for $package_name"
        if deb_asset_ids=$(curl -fqs https://api.github.com/repos/${repo}/releases/${release_id}/assets | jq -r '.[] | select(.name | endswith(".deb")) | .id')
        then
          for deb_asset_id in $deb_asset_ids;
          do
            GOT_DEB=1
            mkdir -p "${DEB_POOL}/${package_name}"
            pushd "${DEB_POOL}/${package_name}" >/dev/null
            echo "Getting DEB"
            curl -LOJ -H "Accept: application/octet-stream" "https://api.github.com/repos/${repo}/releases/assets/${deb_asset_id}"
            popd >/dev/null
          done
        fi
        if rpm_asset_ids=$(curl -fqs https://api.github.com/repos/${repo}/releases/${release_id}/assets | jq -r '.[] | select(.name | endswith(".rpm")) | .id')
        then
          for rpm_asset_id in $rpm_asset_ids;
          do
            GOT_RPM=1
            mkdir -p generated_repo/rpm
            pushd generated_repo/rpm >/dev/null
            echo "Getting RPM"
            rpm_file=$(curl -fqs https://api.github.com/repos/${repo}/releases/assets/${rpm_asset_id} | jq -r '.name')
            curl -LOJ -H "Accept: application/octet-stream" "https://api.github.com/repos/${repo}/releases/assets/${rpm_asset_id}"
            (
              if [ -n "$GPG_FINGERPRINT" ]
              then
                echo "Signing RPM"
                rpm --define "%_signature gpg" --define "%_gpg_name ${GPG_FINGERPRINT}" --addsign "${rpm_file}"
              fi
            )
            popd >/dev/null
          done
        fi
      done
    fi
  done < "$REPOS_PATH"

  if [ $GOT_DEB -eq 1 ]
  then
    pushd "generated_repo/deb" >/dev/null
    architectures="amd64 arm64 all"
    for arch in $architectures;
    do
      mkdir -p "${DEB_DISTS_COMPONENTS}-${arch}"
      echo "Scanning all downloaded DEB Packages and creating Packages file."
      dpkg-scanpackages --arch ${arch} pool/ > "${DEB_DISTS_COMPONENTS}-${arch}/Packages"
      gzip -9 > "${DEB_DISTS_COMPONENTS}-${arch}/Packages.gz" < "${DEB_DISTS_COMPONENTS}-${arch}/Packages"
      bzip2 -9 > "${DEB_DISTS_COMPONENTS}-${arch}/Packages.bz2" < "${DEB_DISTS_COMPONENTS}-${arch}/Packages"
    done
    popd >/dev/null
    mkdir -p "generated_repo/deb/dists/stable"
    pushd "generated_repo/deb/dists/stable" >/dev/null
    echo "Making Release file"
    {
      echo "Origin: Nasp"
      echo "Label: Nasp"
      echo "Suite: stable"
      echo "Codename: stable"
      echo "Version: 1.0"
      echo "Architectures: ${architectures}"
      echo "Components: main"
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
    pushd generated_repo/rpm >/dev/null
    echo "Scanning RPM packages and creating the Repo"
    createrepo_c .
    echo "Signing the Repo Metadata"
    gpg --detach-sign --armor repodata/repomd.xml
    echo "RPM repo built"
    popd >/dev/null
  fi
}

main
