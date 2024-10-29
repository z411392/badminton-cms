import { SessionKeys } from "~/lib/utils/sessions"
import { type Group } from "~/lib/modules/GroupManaging/dtos/Group"
import { type Permission } from "~/lib/modules/IdentityAndAccessManaging/dtos/Permission"
import { onRetrievingGroup } from "~/lib/modules/GroupManaging/presentation/controllers/onRetrievingGroup"

export const withGroupResolving = async (groupId: string) => {
    const { data: groupData } = useNuxtData(SessionKeys.Group) as { data: Ref<Group> }
    const { data: permissionData } = useNuxtData(SessionKeys.Permission) as { data: Ref<Permission | undefined> }
    const payload = await onRetrievingGroup(groupId)
    if (!payload) return
    const { group, permission } = payload
    groupData.value = group
    permissionData.value = permission
}
