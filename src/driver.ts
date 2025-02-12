/*
|--------------------------------------------------------------------------
| Ally Oauth driver
|--------------------------------------------------------------------------
|
| Make sure you through the code and comments properly and make necessary
| changes as per the requirements of your implementation.
|
*/

import { Oauth2Driver, RedirectRequest } from '@adonisjs/ally'
import type { HttpContext } from '@adonisjs/core/http'
import type {
  AllyDriverContract,
  AllyUserContract,
  ApiRequestContract,
  LiteralStringUnion,
} from '@adonisjs/ally/types'

/**
 *
 * Access token returned by your driver implementation. An access
 * token must have "token" and "type" properties and you may
 * define additional properties (if needed)
 */
export type TwitchAccessToken = {
  token: string
  type: 'bearer'
  refreshToken: string
  expiresIn: number
  expiresAt: any
  scope: string[]
}

/**
 * Scopes accepted by the driver implementation.
 */
export type TwitchScopes =
  | 'analytics:read:extensions'
  | 'analytics:read:games'
  | 'bits:read'
  | 'channel:bot'
  | 'channel:manage:ads'
  | 'channel:read:ads'
  | 'channel:manage:broadcast'
  | 'channel:read:charity'
  | 'channel:edit:commercial'
  | 'channel:read:editors'
  | 'channel:manage:extensions'
  | 'channel:read:goals'
  | 'channel:read:guest_star'
  | 'channel:manage:guest_star'
  | 'channel:read:hype_train'
  | 'channel:manage:moderators'
  | 'channel:read:polls'
  | 'channel:manage:polls'
  | 'channel:read:predictions'
  | 'channel:manage:predictions'
  | 'channel:manage:raids'
  | 'channel:read:redemptions'
  | 'channel:manage:redemptions'
  | 'channel:manage:schedule'
  | 'channel:read:stream_key'
  | 'channel:read:subscriptions'
  | 'channel:manage:videos'
  | 'channel:read:vips'
  | 'channel:manage:vips'
  | 'clips:edit'
  | 'moderation:read'
  | 'moderator:manage:announcements'
  | 'moderator:manage:automod'
  | 'moderator:read:automod_settings'
  | 'moderator:read:banned_users'
  | 'moderator:manage:banned_users'
  | 'moderator:read:blocked_terms'
  | 'moderator:read:chat_messages'
  | 'moderator:manage:blocked_terms'
  | 'moderator:manage:chat_messages'
  | 'moderator:read:chat_settings'
  | 'moderator:manage:chat_settings'
  | 'moderator:read:chatters'
  | 'moderator:read:followers'
  | 'moderator:read:guest_star'
  | 'moderator:manage:guest_star'
  | 'moderator:read:moderators'
  | 'moderator:read:shield_mode'
  | 'moderator:manage:shield_mode'
  | 'moderator:read:shoutouts'
  | 'moderator:manage:shoutouts'
  | 'moderator:read:suspicious_users'
  | 'moderator:read:unban_requests'
  | 'moderator:manage:unban_requests'
  | 'moderator:read:vips'
  | 'moderator:read:warnings'
  | 'moderator:manage:warnings'
  | 'user:bot'
  | 'user:edit'
  | 'user:edit:broadcast'
  | 'user:read:blocked_users'
  | 'user:manage:blocked_users'
  | 'user:read:broadcast'
  | 'user:read:chat'
  | 'user:manage:chat_color'
  | 'user:read:email'
  | 'user:read:emotes'
  | 'user:read:follows'
  | 'user:read:moderated_channels'
  | 'user:read:subscriptions'
  | 'user:read:whispers'
  | 'user:manage:whispers'
  | 'user:write:chat'

/**
 * The configuration accepted by the driver implementation.
 */
export type TwitchConfig = {
  clientId: string
  clientSecret: string
  callbackUrl: string
  authorizeUrl?: string
  accessTokenUrl?: string
  userInfoUrl?: string
  scopes?: LiteralStringUnion<TwitchScopes>[]
}

/**
 * Driver implementation. It is mostly configuration driven except the API call
 * to get user info.
 */
export class Twitch
  extends Oauth2Driver<TwitchAccessToken, TwitchScopes>
  implements AllyDriverContract<TwitchAccessToken, TwitchScopes>
{
  /**
   * The URL for the redirect request. The user will be redirected on this page
   * to authorize the request.
   *
   * Do not define query strings in this URL.
   */
  protected authorizeUrl = 'https://id.twitch.tv/oauth2/authorize'

  /**
   * The URL to hit to exchange the authorization code for the access token
   *
   * Do not define query strings in this URL.
   */
  protected accessTokenUrl = 'https://id.twitch.tv/oauth2/token'

  /**
   * The URL to hit to get the user details
   *
   * Do not define query strings in this URL.
   */
  protected userInfoUrl = 'https://api.twitch.tv/helix/users'

  /**
   * The param name for the authorization code. Read the documentation of your oauth
   * provider and update the param name to match the query string field name in
   * which the oauth provider sends the authorization_code post redirect.
   */
  protected codeParamName = 'code'

  /**
   * The param name for the error. Read the documentation of your oauth provider and update
   * the param name to match the query string field name in which the oauth provider sends
   * the error post redirect
   */
  protected errorParamName = 'error'

  /**
   * Cookie name for storing the CSRF token. Make sure it is always unique. So a better
   * approach is to prefix the oauth provider name to `oauth_state` value. For example:
   * For example: "facebook_oauth_state"
   */
  protected stateCookieName = 'TwitchDriver_oauth_state'

  /**
   * Parameter name to be used for sending and receiving the state from.
   * Read the documentation of your oauth provider and update the param
   * name to match the query string used by the provider for exchanging
   * the state.
   */
  protected stateParamName = 'state'

  /**
   * Parameter name for sending the scopes to the oauth provider.
   */
  protected scopeParamName = 'scope'

  /**
   * The separator indentifier for defining multiple scopes
   */
  protected scopesSeparator = ' '

  constructor(
    ctx: HttpContext,
    public config: TwitchConfig
  ) {
    super(ctx, config)

    /**
     * Extremely important to call the following method to clear the
     * state set by the redirect request.
     *
     * DO NOT REMOVE THE FOLLOWING LINE
     */
    this.loadState()
  }

  /**
   * Optionally configure the authorization redirect request. The actual request
   * is made by the base implementation of "Oauth2" driver and this is a
   * hook to pre-configure the request.
   */
  protected configureRedirectRequest(request: RedirectRequest<TwitchScopes>) {
    request.scopes(this.config.scopes || ['user:read:email'])

    request.param('response_type', 'code')
    request.param('grant_type', 'authorization_code')
  }

  /**
   * Optionally configure the access token request. The actual request is made by
   * the base implementation of "Oauth2" driver and this is a hook to pre-configure
   * the request
   */
  // protected configureAccessTokenRequest(request: ApiRequest) {}

  /**
   * Update the implementation to tell if the error received during redirect
   * means "ACCESS DENIED".
   */
  accessDenied() {
    const error = this.getError()

    if (!error) {
      return false
    }

    return this.ctx.request.input('error') === 'user_denied'
  }

  /**
   * Get the user details by query the provider API. This method must return
   * the access token and the user details both. Checkout the google
   * implementation for same.
   *
   * https://github.com/adonisjs/ally/blob/develop/src/Drivers/Google/index.ts#L191-L199
   */
  async user(
    callback?: (request: ApiRequestContract) => void
  ): Promise<AllyUserContract<TwitchAccessToken>> {
    const accessToken = await this.accessToken()
    const request = this.httpClient(this.config.userInfoUrl || this.userInfoUrl)

    /**
     * Allow end user to configure the request. This should be called after your custom
     * configuration, so that the user can override them (if needed)
     */
    if (typeof callback === 'function') {
      callback(request)
    }

    const body = await request.get()
    const data = body.data[0]

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, login, display_name, email, profile_image_url } = data

    return {
      id,
      nickName: login,
      name: display_name,
      email,
      emailVerificationState: 'unsupported' as const,
      avatarUrl: profile_image_url,
      original: data,
      token: accessToken,
    }
  }

  async userFromToken(
    accessToken: string,
    callback?: (request: ApiRequestContract) => void
  ): Promise<AllyUserContract<{ token: string; type: 'bearer' }>> {
    const request = this.httpClient(this.config.userInfoUrl || this.userInfoUrl)

    /**
     * Allow end user to configure the request. This should be called after your custom
     * configuration, so that the user can override them (if needed)
     */
    if (typeof callback === 'function') {
      callback(request)
    }

    const body = await request.get()
    const data = body.data[0]

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, login, display_name, email, profile_image_url } = data

    return {
      id,
      nickName: login,
      name: display_name,
      email,
      emailVerificationState: 'unsupported' as const,
      avatarUrl: profile_image_url,
      original: data,
      token: { token: accessToken, type: 'bearer' as const },
    }
  }
}

/**
 * The factory function to reference the driver implementation
 * inside the "config/ally.ts" file.
 */
export function TwitchService(config: TwitchConfig): (ctx: HttpContext) => Twitch {
  return (ctx) => new Twitch(ctx, config)
}
