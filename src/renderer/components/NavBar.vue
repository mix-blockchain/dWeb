<template>
  <b-navbar :fixed-top="true" type="is-dark">
    <template slot="brand">
      <b-navbar-item tag="div" class="profile-avatar">
        <ipfs-image :ipfsHash="image" :key="image"></ipfs-image>
      </b-navbar-item>
      <b-navbar-item tag="div" class="profile-name">
        <profile-link :address="address"></profile-link>
        <span v-if="unlocked" class="clickable mdi mdi-12px mdi-lock-open" style="color: #228B22;" @click="lock"></span>
        <span v-else class="clickable mdi mdi-12px mdi-lock" style="color: #CE2029;" @click="passwordFieldType = ''; password = ''; enterPassword = !enterPassword"></span>
      </b-navbar-item>
      <b-navbar-item v-if="enterPassword" tag="div">
        <b-field :type="passwordFieldType">
          <b-input type="password" v-model="password" password-reveal @keydown.native.enter="unlock"></b-input>
        </b-field>
      </b-navbar-item>
      <b-navbar-item tag="div">
        <div>{{ balance }} MIX</div>
      </b-navbar-item>
      <b-navbar-item v-if="$isDesktop" tag="div">
        <navigation></navigation>
      </b-navbar-item>
    </template>
    <template slot="start">
      <b-navbar-dropdown :label="$t('NavBar.General')">
        <b-navbar-item tag="router-link" :to="{ path: '/home' }">
          {{ $t('NavBar.Home') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/feeds' }">
          {{ $t('NavBar.MyFeeds') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/subscriptions' }">
          {{ $t('NavBar.Subscriptions') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/interactions' }">
          {{ $t('NavBar.Interactions') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/browsing-history' }">
          {{ $t('NavBar.BrowsingHistory') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/publish-item' }">
          {{ $t('NavBar.PublishItem') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/goto' }">
          {{ $t('NavBar.GotoItem') }}
        </b-navbar-item>
      </b-navbar-dropdown>
      <b-navbar-dropdown :label="$t('NavBar.Account')">
        <b-navbar-item tag="router-link" :to="{ path: '/transaction-history' }">
          {{ $t('NavBar.TransactionHistory') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/trusted-accounts' }">
          {{ $t('NavBar.TrustedAccounts') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/wallet' }">
          {{ $t('NavBar.Wallet') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/tokens' }">
          {{ $t('NavBar.Tokens') }}
        </b-navbar-item>
      </b-navbar-dropdown>
      <b-navbar-dropdown :label="$t('NavBar.Administration')">
        <b-navbar-item tag="router-link" :to="{ path: '/manage-accounts' }">
          {{ $t('NavBar.Accounts') }}
        </b-navbar-item>
        <b-navbar-item v-if="$isDesktop" tag="router-link" :to="{ path: '/transcoding' }">
          {{ $t('NavBar.Transcoding') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/node-status' }">
          {{ $t('NavBar.NodeStatus') }}
        </b-navbar-item>
        <b-navbar-item v-if="$isDesktop" tag="router-link" :to="{ path: '/mining' }">
          {{ $t('NavBar.Mining') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/settings' }">
          {{ $t('NavBar.Settings') }}
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/debug' }">
          {{ $t('NavBar.DebugItem') }}
        </b-navbar-item>
      </b-navbar-dropdown>
    </template>
  </b-navbar>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Navigation from './Navigation.vue'
  import MixItem from '../../lib/MixItem'
  import ProfileLink from './ProfileLink.vue'
  import IpfsImage from './IpfsImage.vue'

  export default Vue.extend({
    name: 'nav-bar',
    components: {
      Navigation,
      ProfileLink,
      IpfsImage,
    },
    data() {
      return {
        address: '',
        image: '',
        unlocked: false,
        enterPassword: false,
        passwordFieldType: '',
        password: '',
        balance: '',
      }
    },
    methods: {
      async loadData() {
        this.unlocked = this.$activeAccount.get().isUnlocked()
        try {
          this.address = await this.$activeAccount.get().contractAddress
          this.balance = this.$mixClient.formatWei(await this.$activeAccount.get().getBalance())
          let itemId = await this.$activeAccount.get().call(this.$mixClient.accountProfile, 'getProfile')
          let item: MixItem = await new MixItem(this, itemId).init()
          let revision = await item.latestRevision().load()
          this.image = revision.getImage(50, 50)
        }
        catch (error) {
          this.title = ''
          this.image = ''
        }
      },
      async unlock() {
        try {
          await this.$activeAccount.get().unlock(this.password)
        }
        catch (e) {
          this.passwordFieldType = 'is-danger'
          return
        }
        this.enterPassword = false
        this.password = ''
        this.loadData()
      },
      lock() {
        this.$activeAccount.get().lock()
        this.loadData()
      },
      changeActiveAccount() {
        this.address = ''
        this.loadData()
      },
    },
    created() {
      this.$root.$on('change-active-account', this.changeActiveAccount)
      this.newBlockHeadersEmitter = this.$mixClient.web3.eth.subscribe('newBlockHeaders')
      .on('data', (block: any) => {
        this.loadData()
      })
      this.loadData()
    },
    destroyed() {
      this.$root.$off('change-active-account', this.changeActiveAccount)
      this.newBlockHeadersEmitter.unsubscribe()
    },
  })
</script>

<style scoped>

  nav >>> .profile-avatar img {
    object-fit: cover;
  }

  nav >>> .profile-name a:hover {
    color: #3273dc;
  }

  nav >>> .clickable {
    cursor: pointer;
    user-select: none;
  }

  nav >>> .navbar-menu {
    background-color: #363636;
  }

  nav >>> .navbar-link {
    color: #f5f5f5;
  }

  nav >>> .navbar-item {
    color: #f5f5f5;
  }

  nav >>> a.navbar-link:hover {
    background-color: #363636;
  }

  nav >>> .navbar-dropdown a:hover {
    background-color: #3273dc;
    color: #f5f5f5;
  }

</style>
