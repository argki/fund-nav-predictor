# ファンド基準価額予想ツール

投資信託の基準価額を予想するWebアプリケーションです。ETF価格と為替レートから基準価額を計算します。

## 機能

- **基準価額の計算**: ETF価格（ドル）× 為替レート（円/ドル）で基準価額を算出
- **前営業日比の計算**: ETF変動分と為替変動分を分けて表示
- **影響係数の表示**: 為替10銭変動やETF 0.1ドル変動が基準価額に与える影響を表示
- **リアルタイム価格取得**: Yahoo Finance APIを使用してETF価格と為替レートを自動取得（オプション）

### 入力項目

- **ETFシンボル**: 予想したいETFのシンボル（例: VTI）
- **ETF価格（ドル）**: 現在のETF価格
- **為替レート（円/ドル）**: 現在の為替レート
- **前営業日ETF価格（ドル）**: 前営業日のETF価格（前営業日比を計算する場合）
- **前営業日為替レート（円/ドル）**: 前営業日の為替レート（前営業日比を計算する場合）

### 計算式

```
基準価額 = ETF価格（ドル）× 為替レート（円/ドル）

前営業日比 = ETF変動分 + 為替変動分

ETF変動分 = (現在のETF価格 - 前営業日ETF価格) × 為替レート
為替変動分 = ETF価格 × (現在の為替レート - 前営業日為替レート)
```

## 計算式の出典

この計算式は、Yahoo!ファイナンス掲示板に投稿されている基準価額予想を参考にしています。

## ローカルでの開発

### 必要な環境

- Ruby 3.1以上
- Bundler

### Macでのセットアップ（Homebrew使用）

#### 1. rbenvとruby-buildのインストール

```bash
# rbenvとruby-buildをインストール
brew install rbenv ruby-build
```

#### 2. rbenvの初期設定

```bash
# zshの場合（macOSのデフォルト）
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# bashの場合
echo 'eval "$(rbenv init - bash)"' >> ~/.bash_profile
source ~/.bash_profile
```

#### 3. Rubyのインストール

```bash
# インストール可能なRubyバージョンを確認
rbenv install -l

# Ruby 3.1以上をインストール（例: 3.4.7）
rbenv install 3.4.7

# グローバルバージョンを設定
rbenv global 3.4.7

# インストール確認
ruby -v
```

#### 4. rbenvが正しく設定されているか確認

```bash
# 現在のRubyのパスを確認（rbenvのパスが表示されるはず）
which ruby
# 例: /Users/username/.rbenv/shims/ruby

# Rubyのバージョンを確認
ruby -v
# 例: ruby 3.4.7

# もしシステムのRuby（/usr/bin/ruby）が表示される場合：
# 1. 新しいターミナルを開く
# 2. または、以下を実行してrbenvを再初期化
eval "$(rbenv init - zsh)"  # zshの場合
# または
eval "$(rbenv init - bash)"  # bashの場合
```

#### 5. Bundlerのインストール

```bash
# rbenvでインストールしたRubyが使われていることを確認してから
gem install bundler

# インストール確認
bundle -v
```

**注意**: もし`You don't have write permissions`エラーが出る場合、システムのRubyを使おうとしています。上記の手順4でrbenvが正しく設定されているか確認してください。

#### 6. プロジェクトのセットアップ

```bash
# プロジェクトディレクトリに移動
cd fund-nav-predictor

# 依存関係のインストール
bundle install

# Jekyllサーバーを起動
bundle exec jekyll serve

# ブラウザで http://localhost:4000 にアクセス
```

### トラブルシューティング

#### rbenvが認識されない場合

```bash
# rbenvのパスを確認
echo $PATH | grep rbenv

# rbenvを手動で初期化（現在のセッションのみ）
eval "$(rbenv init - zsh)"  # zshの場合
# または
eval "$(rbenv init - bash)"  # bashの場合

# シェル設定ファイルを確認
cat ~/.zshrc | grep rbenv  # zshの場合
# または
cat ~/.bash_profile | grep rbenv  # bashの場合
```

#### プロジェクトローカルでRubyバージョンを指定する

```bash
# プロジェクトディレクトリで
cd fund-nav-predictor

# ローカルバージョンを設定（.ruby-versionファイルが作成される）
rbenv local 3.4.7

# これで、このディレクトリでは常に指定したRubyバージョンが使われます
```

### その他のOSでのセットアップ

- **Linux**: ディストリビューションのパッケージマネージャーを使用
- **Windows**: [RubyInstaller](https://rubyinstaller.org/)を使用

## 注意事項

- このツールは投資判断の参考情報を提供するものであり、投資勧誘を目的としたものではありません
- 計算結果は概算値であり、実際の基準価額と異なる場合があります
- 投資判断は自己責任でお願いします
- Yahoo Finance APIは非公式のAPIであり、予告なく変更または利用できなくなる可能性があります

## ライセンス

MIT License
