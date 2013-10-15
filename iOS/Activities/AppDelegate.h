//
//  AppDelegate.h
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Activities.h"
#import "Network.h"
#import "User.h"
#import "Network.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate>

{
    UINavigationController *navigationController;
}

@property (strong, nonatomic) UINavigationController *navigationController;
@property (strong, nonatomic) UIWindow *window;
@property (strong, nonatomic) Activities *activities;
@property (strong, nonatomic) User *user;
@property (strong, nonatomic) Network *network;

- (void)openSession;
- (void) doneLoginToOurServer;

@end
