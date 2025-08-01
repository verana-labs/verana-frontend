'use client';

import { MouseEventHandler } from "react";
import { Button as UIButton, IconName } from "@interchain-ui/react";

export type ButtonProps = {
  text?: string;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export type ConnectProps = Pick<ButtonProps, "text" | "loading" | "onClick">;

function noop() {}

export default function Button({
  text,
  // icon,
  loading,
  disabled,
  onClick = noop,
}: ButtonProps) {
  return (
    <UIButton
      onClick={onClick}
      disabled={disabled}
      isLoading={loading}
    >
      <span>{text}</span>
    </UIButton>
  );
}

export const ButtonConnect = (
  { text = "Connect Wallet", onClick = noop }: ConnectProps,
) => <Button text={text} onClick={onClick} />;

export const ButtonConnected = (
  { text = "My Wallet", onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;

export const ButtonDisconnected = (
  { text = "Connect Wallet", onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;

export const ButtonConnecting = (
  { text = "Connecting ...", loading = true }: ConnectProps,
) => <Button text={text} loading={loading} />;

export const ButtonRejected = (
  { text = "Reconnect", onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;

export const ButtonError = (
  { text = "Change Wallet", onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;

export const ButtonNotExist = (
  { text = "Install Wallet", onClick = noop }: ConnectProps,
) => <Button text={text} icon="walletFilled" onClick={onClick} />;
