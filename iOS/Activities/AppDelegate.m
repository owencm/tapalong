//
//  AppDelegate.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//


#import <FacebookSDK/FacebookSDK.h>
#import "AppDelegate.h"
#import "ActivitesViewController.h"
#import "GlobalStyles.h"
#import "LoginViewController.h"
#import "Activities.h"
#import "Network.h"

@implementation AppDelegate

@synthesize navigationController;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    
    Network *network = [[Network alloc] init];
    self.activities = [[Activities alloc] initWithNetwork:network];
    
    ActivitesViewController *activitiesViewController = [[ActivitesViewController alloc] init];
    navigationController = [[UINavigationController alloc]
                            initWithRootViewController:activitiesViewController];
    
    self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    self.window.rootViewController = navigationController;
    
    self.navigationController.navigationBar.translucent = NO;
    self.navigationController.navigationBar.barTintColor = [[GlobalStyles sharedGlobal] redColor];
    self.navigationController.navigationBar.tintColor = [UIColor whiteColor];
    self.navigationController.navigationBar.titleTextAttributes = [NSDictionary dictionaryWithObject:[UIColor whiteColor] forKey:NSForegroundColorAttributeName];
    [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleLightContent];
    
    [self.window makeKeyAndVisible];
    
    // See if the app has a valid token for the current state.
    if (FBSession.activeSession.state == FBSessionStateCreatedTokenLoaded) {
        NSLog([@"\nToken: " stringByAppendingString:[[FBSession.activeSession accessTokenData] accessToken]]);
        [self openSession];
    } else {
        [self showLoginView];
    }
    
    return YES;
}

- (void)showLoginView
{
    UIViewController *topViewController = [self.navigationController topViewController];
    UIViewController *modalViewController = [topViewController modalViewController];
    
    // If the login screen is not already displayed, display it. If the login screen is
    // displayed, then getting back here means the login in progress did not successfully
    // complete. In that case, notify the login view so it can update its UI appropriately.
    if (![modalViewController isKindOfClass:[LoginViewController class]]) {
        LoginViewController* loginViewController = [[LoginViewController alloc]
                                                      initWithNibName:@"LoginViewController"
                                                      bundle:nil];
        [topViewController presentModalViewController:loginViewController animated:NO];
    } else {
        LoginViewController* loginViewController =
        (LoginViewController*)modalViewController;
        [loginViewController loginFailed];
    }
}

- (void)sessionStateChanged:(FBSession *)session
                      state:(FBSessionState) state
                      error:(NSError *)error
{
    switch (state) {
        case FBSessionStateOpen: {
            UIViewController *topViewController =
            [self.navigationController topViewController];
            if ([[topViewController modalViewController]
                 isKindOfClass:[LoginViewController class]]) {
                [topViewController dismissModalViewControllerAnimated:YES];
            }
        }
            break;
        case FBSessionStateClosed:
        case FBSessionStateClosedLoginFailed:
            // Once the user has logged in, we want them to
            // be looking at the root view.
            [self.navigationController popToRootViewControllerAnimated:NO];
            
            [FBSession.activeSession closeAndClearTokenInformation];
            
            [self showLoginView];
            break;
        default:
            break;
    }
    
    if (error) {
        UIAlertView *alertView = [[UIAlertView alloc]
                                  initWithTitle:@"Error"
                                  message:error.localizedDescription
                                  delegate:nil
                                  cancelButtonTitle:@"OK"
                                  otherButtonTitles:nil];
        [alertView show];
    }
}

- (void)openSession
{
    [FBSession openActiveSessionWithReadPermissions:nil
                                       allowLoginUI:YES
                                  completionHandler:
     ^(FBSession *session,
       FBSessionState state, NSError *error) {
         [self sessionStateChanged:session state:state error:error];
     }];
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
    return [FBSession.activeSession handleOpenURL:url];
}

- (void)applicationWillResignActive:(UIApplication *)application
{
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later. 
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
    // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    [FBSession.activeSession handleDidBecomeActive];
}

- (void)applicationWillTerminate:(UIApplication *)application
{
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
}

@end
