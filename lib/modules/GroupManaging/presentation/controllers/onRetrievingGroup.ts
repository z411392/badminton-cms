import { type Group } from "~/lib/modules/GroupManaging/dtos/Group"
import { type Permission } from "~/lib/modules/IdentityAndAccessManaging/dtos/Permission"
import { translateError } from "~/lib/utils/formatters"
import { showError } from "~/composables/utils/useSnackbar"

export const onRetrievingGroup = async (groupId: string) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/groups/:groupId".replace(":groupId", groupId)
    const data = {}
    try {
        const {
            data: {
                payload: { group, permission },
            },
        } = await axios.get<{ payload: { group: Group; permission?: Permission } }>(uri, data)
        return { group, permission }
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
