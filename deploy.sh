rm -rf packages/frontend/src/artifacts
rm -rf packages/hardhat/artifacts
rm -rf packages/hardhat/ignition/deployments
rm -rf packages/hardhat/cache

cd packages/hardhat
pnpm run deploy
cp -r artifacts ../frontend/src

DEPLOYED_ADDRESSES_FILE=$(find ignition/deployments -maxdepth 3 -name "deployed_addresses.json" | head -n 1) && echo $DEPLOYED_ADDRESSES_FILE
if [ -f "$DEPLOYED_ADDRESSES_FILE" ]; then
  cp "$DEPLOYED_ADDRESSES_FILE" ../frontend/src/artifacts
else
  echo "deployed_addresses.json not found"
fi

cd ../../

