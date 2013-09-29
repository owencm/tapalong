//
//  ActivitesViewController.h
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ActivityTableCell.h"
#import "Activity.h"

@interface ActivitesViewController : UITableViewController

@property NSMutableArray *activities;
- (void)addActivity:(Activity*)activity;

@end
