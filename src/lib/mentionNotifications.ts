import MixAccount from './MixAccount'
import MixItem from './MixItem'


let emitter: any

async function launch(vue: any) {

	let accounts: string[] = []
	// Get accounts.
	await vue.$db.createValueStream({
		'gt': '/account/controllerAddress/',
		'lt': '/account/controllerAddress/z',
	})
	.on('data', async (controller: string) => {
		let account = await new MixAccount(vue, controller).init()
		if (!account.contract) {
			return
		}
		accounts.push(account.contractAddress)
	})

	emitter = vue.$mixClient.itemMentions.events.AddItem({
		toBlock: 'pending',
		filter: {account: accounts},
	})
	.on('data', async (log: any) => {
		let item = await new MixItem(vue, log.returnValues.itemId).init()
		let revision = await item.latestRevision().load()

		let account = await item.account()
		let profileItemId = await account.call(vue.$mixClient.accountProfile, 'getProfile')
		let profileItem = await new MixItem(vue, profileItemId).init()
		let profileRevision = await profileItem.latestRevision().load()
		let avatarUrl = await profileRevision.getImageUrl(200, 200)

		let notification: any = {
			tag: log.returnValues.itemId,
//			lang:
			badge: avatarUrl,
			body: revision.getBodyText(),
			icon: avatarUrl,
		}

		try {
			notification.image = await revision.getImageUrl(1000, 1000)
		}
		catch(e) {

		}

		new Notification(revision.getTitle(), notification)
	})
}

function kill() {
	emitter.unsubscribe()
}

export default { launch, kill }
